import { getDb } from "@/lib/db/client";
import type { BrainAttachment, BrainNode, BrainState, BrainSubpoint, BrainToggle } from "./brain-types";

interface NodeRow {
  id: string;
  parent_id: string | null;
  title: string;
  summary: string | null;
  tags_json: string | null;
  pos_x: number;
  pos_y: number;
  pos_z: number;
}
interface SubpointRow {
  id: string;
  node_id: string;
  parent_subpoint_id: string | null;
  title: string;
  notes: string | null;
  sort_order: number;
  links_json: string | null;
}
interface ToggleRow {
  id: string;
  subpoint_id: string;
  question: string | null;
  answer_text: string | null;
  answer_image_blob_id: string | null;
  answer_document_blob_id: string | null;
  answer_link_json: string | null;
  expanded: number;
  sort_order: number;
}
interface BlobRow {
  id: string;
  name: string;
  mime_type: string;
  data_url: string;
  size_bytes: number;
  created_at: string;
}
interface SubpointAttachmentRow {
  subpoint_id: string;
  blob_id: string;
  sort_order: number;
}

function byteLength(dataUrl: string): number {
  const commaIndex = dataUrl.indexOf(",");
  return commaIndex === -1 ? dataUrl.length : dataUrl.length - commaIndex - 1;
}

export async function listNodes(): Promise<Record<string, BrainNode>> {
  const db = await getDb();
  const [nodeRows, subpointRows, toggleRows, blobRows, subAttRows] = await Promise.all([
    db.select<NodeRow[]>("SELECT * FROM brain_nodes"),
    db.select<SubpointRow[]>("SELECT * FROM brain_subpoints ORDER BY sort_order"),
    db.select<ToggleRow[]>("SELECT * FROM brain_toggles ORDER BY sort_order"),
    db.select<BlobRow[]>("SELECT * FROM file_blobs"),
    db.select<SubpointAttachmentRow[]>("SELECT * FROM brain_subpoint_attachments ORDER BY sort_order"),
  ]);
  if (nodeRows.length === 0) return {};

  const blobsById = new Map<string, BrainAttachment>(
    blobRows.map((b) => [b.id, { id: b.id, name: b.name, mimeType: b.mime_type, dataUrl: b.data_url }]),
  );

  const togglesBySubpoint = new Map<string, ToggleRow[]>();
  for (const row of toggleRows) {
    if (!togglesBySubpoint.has(row.subpoint_id)) togglesBySubpoint.set(row.subpoint_id, []);
    togglesBySubpoint.get(row.subpoint_id)!.push(row);
  }
  const attachmentsBySubpoint = new Map<string, BrainAttachment[]>();
  for (const row of subAttRows) {
    const blob = blobsById.get(row.blob_id);
    if (!blob) continue;
    if (!attachmentsBySubpoint.has(row.subpoint_id)) attachmentsBySubpoint.set(row.subpoint_id, []);
    attachmentsBySubpoint.get(row.subpoint_id)!.push(blob);
  }
  const subpointsByParent = new Map<string | null, SubpointRow[]>();
  for (const row of subpointRows) {
    const key = row.parent_subpoint_id;
    if (!subpointsByParent.has(key)) subpointsByParent.set(key, []);
    subpointsByParent.get(key)!.push(row);
  }

  function toggleFromRow(row: ToggleRow): BrainToggle {
    return {
      id: row.id,
      question: row.question ?? "",
      answerText: row.answer_text ?? "",
      answerImage: row.answer_image_blob_id ? (blobsById.get(row.answer_image_blob_id) ?? null) : null,
      answerDocument: row.answer_document_blob_id ? (blobsById.get(row.answer_document_blob_id) ?? null) : null,
      answerLink: row.answer_link_json ? JSON.parse(row.answer_link_json) : null,
      expanded: !!row.expanded,
    };
  }

  function buildSubpoint(row: SubpointRow): BrainSubpoint {
    return {
      id: row.id,
      title: row.title,
      toggles: (togglesBySubpoint.get(row.id) ?? []).map(toggleFromRow),
      notes: row.notes ?? "",
      attachments: attachmentsBySubpoint.get(row.id) ?? [],
      links: row.links_json ? JSON.parse(row.links_json) : [],
      children: (subpointsByParent.get(row.id) ?? []).map(buildSubpoint),
    };
  }

  const nodesByRootSubpoint = new Map<string, SubpointRow[]>();
  for (const row of subpointRows) {
    if (row.parent_subpoint_id !== null) continue;
    if (!nodesByRootSubpoint.has(row.node_id)) nodesByRootSubpoint.set(row.node_id, []);
    nodesByRootSubpoint.get(row.node_id)!.push(row);
  }

  const nodes: Record<string, BrainNode> = {};
  for (const row of nodeRows) {
    nodes[row.id] = {
      id: row.id,
      title: row.title,
      summary: row.summary ?? "",
      tags: row.tags_json ? JSON.parse(row.tags_json) : [],
      parentId: row.parent_id,
      position: [row.pos_x, row.pos_y, row.pos_z],
      subpoints: (nodesByRootSubpoint.get(row.id) ?? []).map(buildSubpoint),
    };
  }
  return nodes;
}

async function upsertBlob(att: BrainAttachment): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO file_blobs (id, name, mime_type, data_url, size_bytes, created_at) VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO UPDATE SET name=$2, mime_type=$3, data_url=$4, size_bytes=$5`,
    [att.id, att.name, att.mimeType, att.dataUrl, byteLength(att.dataUrl), new Date().toISOString()],
  );
}

// A node's own row is upserted, but its subpoint/toggle/attachment subtree
// is simply cleared and reinserted fresh — cheaper and far less error-prone
// than diffing a recursively nested tree, and cascades (FK ON DELETE
// CASCADE) take care of the old toggles/attachment-links underneath it.
export async function replaceNode(node: BrainNode): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO brain_nodes (id, parent_id, title, summary, tags_json, pos_x, pos_y, pos_z) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (id) DO UPDATE SET parent_id=$2, title=$3, summary=$4, tags_json=$5, pos_x=$6, pos_y=$7, pos_z=$8`,
    [node.id, node.parentId, node.title, node.summary, JSON.stringify(node.tags), ...node.position],
  );
  await db.execute("DELETE FROM brain_subpoints WHERE node_id = $1", [node.id]);

  async function insertSubpoint(sp: BrainSubpoint, parentSubpointId: string | null, order: number): Promise<void> {
    await db.execute(
      `INSERT INTO brain_subpoints (id, node_id, parent_subpoint_id, title, notes, sort_order, links_json)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [sp.id, node.id, parentSubpointId, sp.title, sp.notes, order, JSON.stringify(sp.links)],
    );
    for (let i = 0; i < sp.attachments.length; i++) {
      const att = sp.attachments[i];
      await upsertBlob(att);
      await db.execute("INSERT INTO brain_subpoint_attachments (subpoint_id, blob_id, sort_order) VALUES ($1,$2,$3)", [sp.id, att.id, i]);
    }
    for (let i = 0; i < sp.toggles.length; i++) {
      const t = sp.toggles[i];
      if (t.answerImage) await upsertBlob(t.answerImage);
      if (t.answerDocument) await upsertBlob(t.answerDocument);
      await db.execute(
        `INSERT INTO brain_toggles
          (id, subpoint_id, question, answer_text, answer_image_blob_id, answer_document_blob_id, answer_link_json, expanded, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          t.id,
          sp.id,
          t.question,
          t.answerText,
          t.answerImage?.id ?? null,
          t.answerDocument?.id ?? null,
          t.answerLink ? JSON.stringify(t.answerLink) : null,
          t.expanded ? 1 : 0,
          i,
        ],
      );
    }
    for (let i = 0; i < sp.children.length; i++) await insertSubpoint(sp.children[i], sp.id, i);
  }

  for (let i = 0; i < node.subpoints.length; i++) await insertSubpoint(node.subpoints[i], null, i);
}

// FK ON DELETE CASCADE (brain_nodes.parent_id -> brain_nodes.id) means
// deleting a node also removes every descendant node in one statement,
// mirroring the app's own cascade-delete-children behavior automatically.
export async function deleteNode(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM brain_nodes WHERE id = $1", [id]);
}

export async function syncBrainState(prev: BrainState, next: BrainState): Promise<void> {
  const writes: Promise<void>[] = [];
  for (const id of Object.keys(next.nodes)) {
    if (prev.nodes[id] !== next.nodes[id]) writes.push(replaceNode(next.nodes[id]));
  }
  for (const id of Object.keys(prev.nodes)) {
    if (!(id in next.nodes)) writes.push(deleteNode(id));
  }
  await Promise.all(writes);
}

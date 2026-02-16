/**
 * membersService — Firestore CRUD + subscribe for network members.
 *
 * Firestore path: networks/{networkId}/members/{uid}
 */
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  type Unsubscribe,
  type DocumentData,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import type { MemberConfig, MemberRole } from '@/domain/network';

function toMemberConfig(docId: string, data: DocumentData, networkId: string): MemberConfig {
  return {
    uid:       docId,
    networkId,
    role:      (data.role as MemberRole) ?? 'viewer',
  };
}

export type MembersCallback = (members: MemberConfig[]) => void;

export function subscribeMembers(networkId: string, callback: MembersCallback): Unsubscribe {
  const ref = collection(firestore, `networks/${networkId}/members`);
  return onSnapshot(ref, (snap) => {
    callback(snap.docs.map((d) => toMemberConfig(d.id, d.data(), networkId)));
  });
}

/** Add or update a member (upsert by uid). */
export async function setMember(networkId: string, uid: string, role: MemberRole): Promise<void> {
  await setDoc(doc(firestore, `networks/${networkId}/members/${uid}`), { role });
}

export async function removeMember(networkId: string, uid: string): Promise<void> {
  await deleteDoc(doc(firestore, `networks/${networkId}/members/${uid}`));
}

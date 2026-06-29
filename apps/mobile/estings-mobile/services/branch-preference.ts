import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

export type StoreBranch = 'manila' | 'pampanga';

const storageKey = 'estings.store-branch';
const branchAcknowledgementStorageKey = 'estings.store-branch-acknowledged';
const fileUri = `${FileSystem.documentDirectory}store-branch.txt`;
const branchAcknowledgementFileUri = `${FileSystem.documentDirectory}store-branch-acknowledged.txt`;

export async function getStoreBranch(): Promise<StoreBranch> {
  try {
    const value = Platform.OS === 'web'
      ? globalThis.localStorage?.getItem(storageKey)
      : (await FileSystem.getInfoAsync(fileUri)).exists
        ? await FileSystem.readAsStringAsync(fileUri)
        : null;
    return value === 'pampanga' ? 'pampanga' : 'manila';
  } catch {
    return 'manila';
  }
}

export async function setStoreBranch(branch: StoreBranch) {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(storageKey, branch);
  } else {
    await FileSystem.writeAsStringAsync(fileUri, branch);
  }
  globalThis.dispatchEvent?.(new CustomEvent('estings:branch-changed', { detail: branch }));
}

export async function getAcknowledgedStoreBranch(): Promise<StoreBranch | null> {
  try {
    const value = Platform.OS === 'web'
      ? globalThis.localStorage?.getItem(branchAcknowledgementStorageKey)
      : (await FileSystem.getInfoAsync(branchAcknowledgementFileUri)).exists
        ? await FileSystem.readAsStringAsync(branchAcknowledgementFileUri)
        : null;

    return value === 'manila' || value === 'pampanga' ? value : null;
  } catch {
    return null;
  }
}

export async function setAcknowledgedStoreBranch(branch: StoreBranch) {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(branchAcknowledgementStorageKey, branch);
  } else {
    await FileSystem.writeAsStringAsync(branchAcknowledgementFileUri, branch);
  }
}

import { NavViewProvider } from '../provider';

export async function getHistoryList(provider: NavViewProvider) {
  return await provider.extCtx.workspaceState.get('historyList', []);
}

export async function saveHistoryList(list: any[], provider: NavViewProvider) {
  const maxLength = provider.extCtx.workspaceState.get('historyMaxLength', 100);
  if (list.length > maxLength) {
    list = list.slice(0, maxLength);
  }
  await provider.extCtx.workspaceState.update('historyList', list);
}

export async function getHistoryShown(provider: NavViewProvider) {
  return await provider.extCtx.workspaceState.get('historyShown', false);
}

export async function saveHistoryShown(shown: boolean, provider: NavViewProvider) {
  await provider.extCtx.workspaceState.update('historyShown', shown);
} 
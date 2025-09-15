import React, { useEffect, useState } from 'react';
import AccountModal from './AccountModal';

export const ACCOUNT_MODAL_OPEN_EVENT = 'account:open';
export const ACCOUNT_MODAL_CLOSE_EVENT = 'account:close';
export function openAccountModal() { try { window.dispatchEvent(new CustomEvent(ACCOUNT_MODAL_OPEN_EVENT)); } catch {} }
export function closeAccountModal() { try { window.dispatchEvent(new CustomEvent(ACCOUNT_MODAL_CLOSE_EVENT)); } catch {} }

const AccountModalHost: React.FC = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onClose = () => setOpen(false);
    window.addEventListener(ACCOUNT_MODAL_OPEN_EVENT, onOpen as any);
    window.addEventListener(ACCOUNT_MODAL_CLOSE_EVENT, onClose as any);
    return () => {
      window.removeEventListener(ACCOUNT_MODAL_OPEN_EVENT, onOpen as any);
      window.removeEventListener(ACCOUNT_MODAL_CLOSE_EVENT, onClose as any);
    };
  }, []);

  if (!open) return null;
  return <AccountModal open={open} onClose={() => setOpen(false)} />;
};

export default AccountModalHost;

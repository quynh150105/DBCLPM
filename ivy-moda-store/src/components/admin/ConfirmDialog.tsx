interface ConfirmDialogProps {
  dialog: {
    title: string;
    message: string;
    onConfirm: () => void;
  };
  onClose: () => void;
}

export default function ConfirmDialog({ dialog, onClose }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 animate-fade-in text-left">
      <div className="bg-white border-2 border-black max-w-sm w-full p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="text-xs font-black uppercase tracking-wider text-black border-b border-zinc-200 pb-3 mb-4">
          {dialog.title}
        </h3>
        <p className="text-xs text-zinc-600 mb-6 leading-relaxed">{dialog.message}</p>
        <div className="flex gap-3 justify-end pt-4 border-t border-zinc-200">
          <button
            type="button"
            onClick={onClose}
            className="border-2 border-black px-4 py-2 font-bold uppercase text-[10px] hover:bg-zinc-100 transition cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={() => {
              dialog.onConfirm();
              onClose();
            }}
            className="bg-[#b41b1b] text-white border-2 border-black px-4 py-2 font-bold uppercase text-[10px] hover:bg-red-700 transition cursor-pointer"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}

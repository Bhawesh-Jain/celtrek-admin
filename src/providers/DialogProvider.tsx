'use client'

import { createContext, useContext, ReactNode } from 'react'
import DialogWrapper from '@/components/DialogWrapper'
import { useDialog } from '@/hooks/useDialog'
import { DialogType } from '@/components/DialogWrapper'

export interface DialogButton {
  text: string
  onClick?: () => void
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
}

interface DialogContextType {
  showDialog: (config: {
    title: string
    message: string
    type?: DialogType
    buttons?: DialogButton[]
    onConfirm?: () => void
    confirmText?: string
    cancelText?: string
  }) => void
  showSuccess: (title: string, message: string, buttons?: DialogButton[]) => void
  showError: (title: string, message: string, buttons?: DialogButton[]) => void
  showWarning: (title: string, message: string, buttons?: DialogButton[]) => void
  showDeleteConfirmation: (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText?: string,
    cancelText?: string
  ) => void
  showConfirmation: (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText?: string,
    cancelText?: string
  ) => void
  closeDialog: () => void
  setDialogLoading: (loading: boolean) => void
}

const DialogContext = createContext<DialogContextType | undefined>(undefined)

export function DialogProvider({ children }: { children: ReactNode }) {
  const {
    isOpen,
    dialogConfig,
    closeDialog,
    showDialog,
    showSuccess,
    showError,
    showWarning,
    showDeleteConfirmation,
    showConfirmation,
    setLoading,
  } = useDialog()

  return (
    <DialogContext.Provider
      value={{
        showDialog,
        showSuccess,
        showError,
        showWarning,
        showDeleteConfirmation,
        showConfirmation,
        closeDialog,
        setDialogLoading: setLoading,
      }}
    >
      {children}
      <DialogWrapper
        isOpen={isOpen}
        onClose={closeDialog}
        title={dialogConfig.title}
        message={dialogConfig.message}
        type={dialogConfig.type}
        buttons={dialogConfig.buttons}
        onConfirm={dialogConfig.onConfirm}
        confirmText={dialogConfig.confirmText}
        cancelText={dialogConfig.cancelText}
        isLoading={dialogConfig.isLoading}
      />
    </DialogContext.Provider>
  )
}

export function useGlobalDialog() {
  const context = useContext(DialogContext)
  if (context === undefined) {
    throw new Error('useGlobalDialog must be used within a DialogProvider')
  }
  return context
}
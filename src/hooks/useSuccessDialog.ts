import { useState } from 'react'

export function useSuccessDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [dialogConfig, setDialogConfig] = useState({
    title: 'Success!',
    message: 'Operation completed successfully.',
  })

  const showSuccessDialog = (title?: string, message?: string) => {
    setDialogConfig({
      title: title || 'Success!',
      message: message || 'Operation completed successfully.',
    })
    setIsOpen(true)
  }

  const closeSuccessDialog = () => {
    setIsOpen(false)
  }

  return {
    isOpen,
    dialogConfig,
    showSuccessDialog,
    closeSuccessDialog,
  }
} 
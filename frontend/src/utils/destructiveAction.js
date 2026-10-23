export function validateDestructiveAction({ confirmation = '', expectedText = '', reason = '', reasonRequired = false }) {
  if (expectedText && confirmation.trim() !== expectedText) {
    return `Vui lòng nhập chính xác "${expectedText}" để xác nhận.`
  }
  if (reasonRequired && !reason.trim()) {
    return 'Vui lòng nhập lý do thực hiện thao tác này.'
  }
  return ''
}

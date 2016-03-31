// Inspired by @runspired.
// https://github.com/runspired/flexi/blob/5fa2291a4fff3e60255617ab76e65e87ab941ab8/tests/helpers/get-owner.js
// The test suite hasn't quite caught up to the Owner API yet.
export default function getOwner(context) {
  let _context = context.application.__deprecatedInstance__;
  if (!_context || !_context.lookup) {
    _context = context.application.__container__;
  }
  return _context;
}

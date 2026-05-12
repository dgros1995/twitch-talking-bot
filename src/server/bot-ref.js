// Shared mutable reference so routes can call bot methods without circular imports
const ref = { bot: null };
module.exports = ref;

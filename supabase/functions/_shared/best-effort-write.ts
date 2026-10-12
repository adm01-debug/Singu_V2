export async function bestEffortWrite(
  write: PromiseLike<{ error: unknown }>,
  label: string,
): Promise<void> {
  try {
    const { error } = await write;
    if (error) console.error(label, error);
  } catch (error) {
    console.error(label, error);
  }
}

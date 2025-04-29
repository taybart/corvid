/***************
 *    Utils    *
 **************/

/**
 * Converts bytes to a human-readable string representation
 *
 * @param bytes - The number of bytes to convert
 * @param options - Optional configuration
 * @param options.useSI - If true, use SI units (KB, MB, GB) with powers of 1000
 *                                 If false, use binary units (KiB, MiB, GiB) with powers of 1024
 * @param options.decimals - Number of decimal places to include (default: 2)
 * @return Human-readable representation (e.g., "4.2 MB" or "3.7 GiB")
 */
export type bytesOptions = {
  useSI?: boolean
  decimals?: number
  includeUnits?: boolean
  targetUnit?: string
}
export function bytesToHuman(
  bytes: string,
  options: bytesOptions = {},
): string {
  const {
    useSI = false,
    decimals = 2,
    includeUnits = true,
    targetUnit = null,
  } = options

  const unit = useSI ? 1000 : 1024
  const units = useSI
    ? ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']

  // If no target unit specified, use the auto-scaling behavior
  if (targetUnit === null) {
    let val = parseInt(bytes, 10)
    if (Math.abs(val) < unit) {
      return `${bytes} B`
    }

    let u = 0
    while (Math.abs(val) >= unit && u < units.length - 1) {
      val /= unit
      u++
    }

    if (includeUnits) {
      return `${val.toFixed(decimals)} ${units[u]}`
    }
    return `${val.toFixed(decimals)}`
  }

  // If target unit is specified, convert directly to that unit
  const targetUnitIndex = units.indexOf(targetUnit)

  if (targetUnitIndex === -1) {
    throw new Error(
      `Invalid unit: ${targetUnit}. Valid units are: ${units.join(', ')}`,
    )
  }

  // Convert bytes to the target unit
  let val = parseInt(bytes, 10)
  for (let i = 0; i < targetUnitIndex; i++) {
    val /= unit
  }

  if (includeUnits) {
    return `${val.toFixed(decimals)} ${targetUnit}`
  }
  return `${val.toFixed(decimals)}`
}

/**
 * Generates a random id of length len using provided alphabet
 * @param len - The length of the string to generate
 * @param [alphabet='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'] - The set of characters to use
 * @return A new random id
 */
export function genID(
  len: number = 15,
  alphabet: string = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
) {
  return [...crypto.getRandomValues(new Uint8Array(len))]
    .map((value) => alphabet[Math.floor((value / 255) * alphabet.length)])
    .join('')
}

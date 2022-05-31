
// Get full qualified name based on contract name
export function qualifiedName(contractName: string) {
  return "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM." + contractName;
}

// Extra methods on String type
declare global {
  interface String {
    expectUintWithDecimals(value: number|bigint): bigint;
  }
}

// Expect Uint with 6 decimals
String.prototype.expectUintWithDecimals = function (value: number): bigint {
  return this.expectUint(Math.round(value * 1000000));
};


// Get full qualified name based on contract name
export function qualifiedName(contractName: string) {
  return "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM." + contractName;
}

// Extra methods on String type
declare global {
  interface String {
    expectUintWithDecimals(value: number): number;
  }
}

// Expect Uint with 6 decimals
String.prototype.expectUintWithDecimals = function (value: number) {
  return this.expectUint(Math.round(value * 1000000));
};

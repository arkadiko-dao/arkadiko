export const typeToReadableName = (type:string) => {
  if (type === 'change_risk_parameter') {
    return 'Change Risk Parameter';
  }

  return '';
};

export const deductTitle = (type:string) => {
  if (type === 'change_risk_parameter') {
    return 'on collateral type';
  } else if (type === 'new_collateral_type') {
    return 'to introduce new collateral type';
  }

  return '';
};

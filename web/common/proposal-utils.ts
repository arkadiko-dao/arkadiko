export const typeToReadableName = (type:string) => {
  if (type === 'change_risk_parameter') {
    return 'Change Risk Parameter';
  } else if (type === 'add_collateral_type') {
    return 'New Collateral Type';
  } else if (type === 'emergency_shutdown') {
    return 'Emergency Shutdown';
  } else if (type === 'stacking_distribution') {
    return 'Stacking Distribution';
  }

  return type;
};

export const deductTitle = (type:string) => {
  if (type === 'change_risk_parameter') {
    return 'on collateral type';
  } else if (type === 'add_collateral_type') {
    return 'Introduce new collateral type';
  } else if (type === 'emergency_shutdown') {
    return 'Toggle Emergency Shutdown';
  } else if (type === 'stacking_distribution') {
    return 'Stacking Distribution';
  }

  return type;
};

export const changeKeyToHumanReadable = (keyName: string) => {
  if (keyName === 'liquidation_penalty') {
    return 'Change Liquidation Penalty';
  } else if (keyName === 'maximum_debt') {
    return 'Change Maximum Debt';
  } else if (keyName === 'liquidation_ratio') {
    return 'Change Liquidation Ratio';
  } else if (keyName === 'emergency_shutdown') {
    return 'Emergency Shutdown: ';
  } else if (keyName === 'stacking_distribution') {
    return 'Stacking Distribution';
  }

  return keyName;
};

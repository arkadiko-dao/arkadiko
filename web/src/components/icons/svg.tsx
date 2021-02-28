import * as React from 'react';
import { Box, BoxProps } from '@blockstack/ui';

interface SVGProps {
  viewBox?: string;
  fill?: string;
}

type SVG = SVGProps & BoxProps;

export const Svg = ({
  width = '24px',
  height = 'auto',
  viewBox = '0 0 24 24',
  fill = 'none',
  ...rest
}: SVG) => {
  return <Box as="svg" width={width} height={height} {...rest} />;
};

//   return <Box as="svg" width={width} height={height} viewBox={viewBox} fill={fill} {...rest} />;

import React from 'react';

interface ContainerProps {}
export const Container: React.FC<ContainerProps> = ({ children, ...props }) => {
  return (
    <div className="w-full min-h-screen bg-gray-100" {...props}>
      <div className="px-6 mx-auto max-w-7xl lg:px-8">
        {children}
      </div>
    </div>
  );
};

export const Home: React.FC = () => {
  return (
    <Container>
      <span>Hello!</span>
    </Container>
  );
};

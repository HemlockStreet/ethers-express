import { Container, Nav, Navbar, NavDropdown } from 'react-bootstrap';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function NavigationBar(props) {
  const { connect } = props;

  return (
    <div>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand href="" name="home">
            BackendFrontend
          </Navbar.Brand>
          {connect && (
            <ConnectButton
              showBalance={false}
              accountStatus={{
                smallScreen: 'address',
                largeScreen: 'full',
              }}
            />
          )}
        </Container>
      </Navbar>

      <hr />
      <br />
    </div>
  );
}

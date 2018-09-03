import * as React from 'react';
// @ts-ignore
import * as brace from 'brace';
import AceEditor from 'react-ace';
import 'ayu-ace/light';
import 'brace/mode/ocaml';
import 'brace/ext/searchbox';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import styled from 'styled-components';

import Controls from './Controls';
import { ApplicationState } from '../../store/index';
import * as bcActions from '../../store/blockchain/actions';
import * as fsActions from '../../store/fs/actions';
import { ContractSrcFile } from '../../store/fs/types';
import { Account } from '../../store/blockchain/types';

const Editor = styled(AceEditor)`
  .error-marker {
    position: absolute;
  }

  .error-marker:after {
    position: relative;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1.5px;
    background: linear-gradient(45deg, transparent, transparent 49%, red 49%, transparent 51%);
  }
`;

const Wrapper = styled.div`
  flex: 1;
  min-width: 0;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
`;

interface OwnProps {}
interface MappedProps {
  activeAccount: Account | null;
  accounts: { [address: string]: Account };
  contract: ContractSrcFile;
}

interface DispatchProps {
  setCurrentAccount: typeof bcActions.setCurrentAccount;
  check: typeof fsActions.check;
  update: typeof fsActions.update;
}

type Props = OwnProps & MappedProps & DispatchProps;

interface State {
  contract: ContractSrcFile;
}

class ScillaEditor extends React.Component<Props, State> {
  static getDerivedStateFromProps(props: Props, state: State) {
    // a new contract has been loaded
    if (state.contract && state.contract.name !== props.contract.name) {
      return { ...state, contract: props.contract };
    }

    return null;
  }

  state: State = {
    contract: {
      name: '',
      code: '',
    },
  };

  handleCheck = () => {
    const { check } = this.props;
    const { contract } = this.state;
    check(contract.code);
  };

  handleSave = () => {
    const { update } = this.props;
    const { contract } = this.state;
    update(contract.name, contract.code);
  };

  handleSetCurrentAccount: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    console.log(`Selected ${e.target.value}`);
    this.props.setCurrentAccount(e.target.value);
  };

  onChange = (value: string): void => {
    this.setState({ contract: { ...this.state.contract, code: value } });
  };

  getAnnotations = (): any => {
    const { contract } = this.props;

    if (contract.error) {
      return [
        {
          row: parseInt(contract.error.line, 10) - 1,
          col: parseInt(contract.error.column, 10),
          type: 'error',
          text: contract.error.message,
        },
      ];
    }

    return [];
  };

  render() {
    const { contract } = this.state;
    const { activeAccount, accounts } = this.props;

    return (
      <Wrapper>
        <Controls
          activeAccount={activeAccount}
          accounts={accounts}
          activeFile={contract}
          handleCheck={this.handleCheck}
          handleSave={this.handleSave}
          handleSetCurrentAccount={this.handleSetCurrentAccount}
        />
        <Editor
          mode="ocaml"
          theme="ayu-light"
          fontSize={16}
          onChange={this.onChange}
          name="scilla-editor"
          annotations={this.getAnnotations()}
          editorProps={{ $blockScrolling: true }}
          style={{ flexGrow: 1, width: '100%', height: '' }}
          value={contract.code}
          readOnly={contract.name.length === 0}
        />
      </Wrapper>
    );
  }
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  setCurrentAccount: (address: string) => dispatch(bcActions.setCurrentAccount(address)),
  update: (name: string, code: string) => dispatch(fsActions.update(name, code)),
  check: (code: string) => dispatch(fsActions.check(code)),
});

const mapStateToProps = (state: ApplicationState) => ({
  contract:
    state.fs.activeContract && state.fs.activeContract.length > 1
      ? state.fs.contracts[state.fs.activeContract]
      : { name: '', code: '' },
  activeAccount: state.blockchain.accounts[state.blockchain.current] || null,
  accounts: state.blockchain.accounts,
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ScillaEditor);

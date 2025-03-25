import React, { Component } from 'react';
import './App.css';
import axios from 'axios';

class App extends Component {
  constructor() {
    super();
    this.state = {
      inputText: '',
      outputText: '',
      mode: 'decrypt',
      key: '',
      foundKey: '',
      keyDetails: '',
      isLoading: false,
      error: null,
      showDetails: false
    };

    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleKeyChange = this.handleKeyChange.bind(this);
    this.handleModeChange = this.handleModeChange.bind(this);
    this.handleProcess = this.handleProcess.bind(this);
    this.toggleDetails = this.toggleDetails.bind(this);
  }

  handleInputChange(event) {
    this.setState({ inputText: event.target.value });
  }

  handleKeyChange(event) {
    this.setState({ key: event.target.value });
  }

  handleModeChange(event) {
    this.setState({ mode: event.target.value });
  }

  toggleDetails() {
    this.setState(prevState => ({ showDetails: !prevState.showDetails }));
  }

  handleProcess() {
    this.setState({ 
      isLoading: true, 
      error: null, 
      outputText: '', 
      foundKey: '', 
      keyDetails: '',
      showDetails: false 
    });
    
    axios.get('http://localhost:8080/cipher', {
      params: {
        text: this.state.inputText,
        mode: this.state.mode,
        key: this.state.key
      }
    })
    .then(response => {
      if (response.data.error) {
        this.setState({ 
          error: response.data.error,
          isLoading: false 
        });
      } else {
        this.setState({ 
          outputText: response.data.result,
          foundKey: response.data.foundKey || '',
          keyDetails: response.data.keyDetails || '',
          isLoading: false 
        });
      }
    })
    .catch(error => {
      console.error("Error processing cipher:", error);
      this.setState({ 
        error: "Error connecting to the server. Please try again.",
        isLoading: false 
      });
    });
  }
     
  render() {
    return (
      <div className='cipher-container'>
        <h1 className='title'>Simple Substitution Cipher Solver</h1>
        
        <div className='mode-selector'>
          <label>
            <input 
              type="radio" 
              value="encrypt" 
              checked={this.state.mode === 'encrypt'} 
              onChange={this.handleModeChange} 
            />
            Encrypt
          </label>
          <label>
            <input 
              type="radio" 
              value="decrypt" 
              checked={this.state.mode === 'decrypt'} 
              onChange={this.handleModeChange} 
            />
            Decrypt
          </label>
        </div>
        
        <div className='input-container'>
          <textarea
            className='text-area'
            placeholder={this.state.mode === 'encrypt' ? 'Enter plaintext to encrypt...' : 'Enter ciphertext to decrypt...'}
            value={this.state.inputText}
            onChange={this.handleInputChange}
            rows={5}
          />
        </div>
        
        <div className='key-container'>
          <input
            className='key-input'
            type="text"
            placeholder="Optional: Enter key (leave blank to auto-solve)"
            value={this.state.key}
            onChange={this.handleKeyChange}
          />
        </div>
        
        <div className='button-container'>
          <button 
            className='button' 
            onClick={this.handleProcess}
            disabled={this.state.isLoading || !this.state.inputText.trim()}
          >
            {this.state.isLoading ? 'Processing...' : this.state.mode === 'encrypt' ? 'Encrypt' : 'Decrypt'}
          </button>
        </div>
        
        {this.state.error && <div className='error-message'>{this.state.error}</div>}
        
        {this.state.foundKey && (
          <div className='key-container'>
            <h3>Found Key:</h3>
            <input
              className='key-input found-key'
              type="text"
              value={this.state.foundKey}
              readOnly
            />
          </div>
        )}

        <div className='output-container'>
          <h3>Result:</h3>
          <textarea
            className='text-area'
            value={this.state.outputText}
            readOnly
            rows={5}
          />
        </div>

        {this.state.keyDetails && (
          <div className='details-container'>
            <button 
              className='button details-button' 
              onClick={this.toggleDetails}
            >
              {this.state.showDetails ? 'Hide Details' : 'Show Details'}
            </button>

            {this.state.showDetails && (
              <textarea
                className='text-area details-text'
                value={this.state.keyDetails}
                readOnly
                rows={10}
              />
            )}
          </div>
        )}
      </div>
    );
  }
}

export default App;
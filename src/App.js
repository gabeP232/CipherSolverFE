import React, { Component } from 'react';
import './App.css';
import axios from 'axios';

class App extends Component {
  constructor() {
    super();
    this.state = {
      inputText: '',
      outputText: '',
      mode: 'encrypt', // Default mode
      key: '',
      isLoading: false,
      error: null
    };

    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleKeyChange = this.handleKeyChange.bind(this);
    this.handleModeChange = this.handleModeChange.bind(this);
    this.handleProcess = this.handleProcess.bind(this);
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

  handleProcess() {
    this.setState({ isLoading: true, error: null });
    
    // Send the request to backend API with the text, mode, and key as query parameters
    axios.get('http://localhost:8080/cipher', {
      params: {
        text: this.state.inputText,
        mode: this.state.mode,
        key: this.state.key
      }
    })
    .then(response => {
      this.setState({ 
        outputText: response.data.result,
        isLoading: false 
      });
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
        <h1 className='title'>Simple Substitution Cipher Decryptor and Encryptor</h1>
        
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
        
        {this.state.mode === 'encrypt' && (
          <div className='key-container'>
            <label htmlFor="key-input">Substitution Key (optional):</label>
            <input
              id="key-input"
              className='key-input'
              type="text"
              placeholder="Enter key (e.g., 'qwertyuiopasdfghjklzxcvbnm' or custom alphabet)"
              value={this.state.key}
              onChange={this.handleKeyChange}
            />
            <p className='key-help'>
              The key defines the substitution alphabet. Must consist of all characters in the alphabet (duplicates will be ignored) 
            </p>
          </div>
        )}
        
        <div className='input-container'>
          <textarea
            className='text-area'
            placeholder={this.state.mode === 'encrypt' ? 'Enter plaintext to encrypt...' : 'Enter ciphertext to decrypt...'}
            value={this.state.inputText}
            onChange={this.handleInputChange}
            rows={5}
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
        
        <div className='output-container'>
          <h3>Result:</h3>
          <textarea
            className='text-area'
            value={this.state.outputText}
            readOnly
            rows={5}
          />
        </div>
        
        {this.state.mode === 'encrypt' && this.state.key && (
          <div className='key-info'>
            <p>Remember this key for decryption: <strong>{this.state.key}</strong></p>
          </div>
        )}
      </div>
    );
  }
}

export default App;
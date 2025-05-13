import React, { Component } from 'react';
import './App.css';
import axios from 'axios';

class App extends Component {
  constructor() {
    super();
    // setup with all variables
    this.state = {
      inputText: '',
      outputText: '',
      mode: 'decrypt',
      cipherType: 'auto',  // Changed default to 'auto' for decrypt mode
      keyInputMode: 'manual', // 'manual', 'random' for encryption 
      key: '',
      foundKey: '',
      keyDetails: '',
      isLoading: false,
      error: null,
      showDetails: false,
      connectionStatus: 'Checking connection...',
      candidates: [],
      selectedCandidate: -1 // -1 means showing the best match 
    };
    
    // Bind methods to ensure correct this
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleKeyChange = this.handleKeyChange.bind(this);
    this.handleModeChange = this.handleModeChange.bind(this);
    this.handleCipherTypeChange = this.handleCipherTypeChange.bind(this);
    this.handleKeyInputModeChange = this.handleKeyInputModeChange.bind(this);
    this.handleProcess = this.handleProcess.bind(this);
    this.toggleDetails = this.toggleDetails.bind(this);
    this.selectCandidate = this.selectCandidate.bind(this);
  }

  // Check connection to backend
  componentDidMount() {
    axios.get('http://localhost:8080/test')
      .then(response => {
        this.setState({ connectionStatus: 'Connected to server' });
      })
      .catch(error => {
        this.setState({ connectionStatus: 'Error connecting to server. Is the backend running?' });
      });
  }

  // Event handling methods
  handleInputChange(event) {
    this.setState({ inputText: event.target.value });
  }

  handleKeyChange(event) {
    this.setState({ key: event.target.value });
  }

  handleModeChange(event) {
    const newMode = event.target.value;
    
    // Reset state when switching modes
    this.setState({
      mode: newMode,
      inputText: '',
      outputText: '',
      key: '',
      foundKey: '',
      keyDetails: '',
      error: null,
      showDetails: false,
      candidates: [],
      selectedCandidate: -1
    });
    
    // Set specific state
    if (newMode === 'encrypt') {
      this.setState({ 
        cipherType: 'caesar',
        keyInputMode: 'manual'
      });
    } else {
      // For decryption, default to auto-detect
      this.setState({ 
        cipherType: 'auto',
        keyInputMode: 'auto'  // For consistency
      });
    }
  }

  handleCipherTypeChange(event) {
    const newCipherType = event.target.value;
    
    this.setState({ 
      cipherType: newCipherType, 
      key: '',
      outputText: '',
      foundKey: '',
      keyDetails: '',
      error: null,
      showDetails: false,
      candidates: [],
      selectedCandidate: -1
    });
    
    // If a specific cipher type is selected in decrypt mode, enable manual key entry
    if (this.state.mode === 'decrypt') {
      // Even with a specific cipher type, we still want auto-detection of the key by default
      this.setState({ keyInputMode: 'auto' });
    }
  }

  handleKeyInputModeChange(event) {
    this.setState({ 
      keyInputMode: event.target.value, 
      key: '',
      outputText: '',
      foundKey: '',
      keyDetails: '',
      error: null,
      showDetails: false,
      candidates: [],
      selectedCandidate: -1
    });
  }

  toggleDetails() {
    this.setState(prevState => ({ showDetails: !prevState.showDetails }));
  }

  // selecting a candidate
  selectCandidate(index) {
    // If same candidate is selected again, toggle back to best match -1
    const newSelectedIndex = this.state.selectedCandidate === index ? -1 : index;
    
    this.setState({ 
      selectedCandidate: newSelectedIndex
    });
    
    // Update output text based on selected candidate
    if (newSelectedIndex === -1) {
      // If going back to default, use the original output
      this.setState({ outputText: this.state.originalOutputText });
    } else if (this.state.candidates.length > newSelectedIndex) {
      // else use the candidate's preview text
      const candidate = this.state.candidates[newSelectedIndex];
      
      // For demonstration purposes
      this.getDecryptionForCandidate(candidate);
    }
  }
  
  // Method to get decryption for a candidate
  getDecryptionForCandidate(candidate) {
  // Set loading state
  this.setState({ isLoading: true, error: null });
  
  // Map candidate cipher names to backend 
  const cipherMap = {
    'Caesar': 'caesar',
    'Simple Substitution': 'substitution',
    'Vigenere': 'vigenere'
  };
  
  // Get the base cipher type 
  const cipherName = candidate.cipher.split(' ')[0];
  const cipherType = cipherMap[cipherName] || 'caesar'; // default to caesar if not found
  
  // Prepare parameters for the request
  const params = {
    text: this.state.inputText,
    mode: 'decrypt',
    cipherType: cipherType,
    key: candidate.key
  };
  
  // Call to backend endpoint
  axios.get('http://localhost:8080/cipher', { params })
  .then(response => {
    // Update the output text
    this.setState({ 
      outputText: response.data.result || '',
      isLoading: false,
      error: null
    });
  })
  .catch(error => {
    console.error("Error getting candidate decryption:", error);
    this.setState({ 
      error: "Error retrieving full candidate decryption.",
      isLoading: false,
      outputText: '' // Clear output text on error
    });
  });
}

  // Backend communication
  handleProcess() {
    // Resets state
    this.setState({ 
      isLoading: true, 
      error: null, 
      outputText: '', 
      foundKey: '', 
      keyDetails: '',
      showDetails: false,
      candidates: [],
      selectedCandidate: -1
    });
    
    // Prepare parameters for backend
    const params = {
      text: this.state.inputText,
      mode: this.state.mode,
    };

    // Add parameters based on mode
    if (this.state.mode === 'encrypt') {
      params.cipherType = this.state.cipherType;
      
      if (this.state.keyInputMode === 'random') {
        params.generateRandomKey = true;
      } else {
        params.key = this.state.key;
      }
    } else { // decrypt mode
      // For decryption, always include cipher type
      params.cipherType = this.state.cipherType;
      
      // Add key only if one is provided
      if (this.state.key.trim() !== '') {
        params.key = this.state.key;
      }
    }
    
    // Call to backend endpoint
    axios.get('http://localhost:8080/cipher', { params })
    .then(response => {
      // Save original output text for toggling betwn candidates
      const originalOutputText = response.data.result || '';
      
      // Parse candidates if they exist
      let candidates = [];
      if (response.data.candidates) {
        try {
          candidates = JSON.parse(response.data.candidates);
          // Sort candidates by fitness score
          candidates.sort((a, b) => parseFloat(a.fitness) - parseFloat(b.fitness));
        } catch (e) {
          console.error("Error parsing candidates JSON:", e);
        }
      }
      
      // Handle the response directly
      this.setState({ 
        outputText: originalOutputText,
        originalOutputText: originalOutputText, // Store original output
        foundKey: response.data.foundKey || '',
        keyDetails: response.data.keyDetails || '',
        isLoading: false,
        candidates: candidates
      });
    })
    .catch(error => {
      // In case of network errors
      console.error("Error processing cipher:", error);
      this.setState({ 
        error: "Error connecting to the server. Please try again.",
        isLoading: false 
      });
    });
  }

  // Get key input placeholder based on cipher type
  getKeyPlaceholder() {
    switch (this.state.cipherType) {
      case 'caesar':
        return "Enter numeric shift value (e.g., 3)";
      case 'substitution':
        return "Enter 26-letter substitution alphabet (e.g., QWERTYUIOPASDFGHJKLZXCVBNM)";
      case 'vigenere':
        return "Enter keyword 2-4 chars";
      default:
        return "Enter key";
    }
  }

  // Check if the key is valid for the selected cipher type
  isKeyValid() {
    if (this.state.keyInputMode !== 'manual') return true;
    
    const { key, cipherType } = this.state;
    
    if (!key.trim()) return false;
    
    switch (cipherType) {
      case 'caesar':
        return /^\d+$/.test(key); // Valid only when one or more digits
      case 'substitution':
        return /^[A-Za-z]{26}$/.test(key);  // Valid only if key is exactly 26 letters
      case 'vigenere':
        return /^[A-Za-z]+$/.test(key);  // Valid only if key is one or more letters
      default:
        return true;
    }
  }

  // Check to disable the process button
  isProcessButtonDisabled() {
    // Always disable if no input text or if currently loading
    if (!this.state.inputText.trim() || this.state.isLoading) {
      return true;
    }

    // For encryption with manual key, validate key
    if (this.state.mode === 'encrypt' && this.state.keyInputMode === 'manual') {
      return !this.isKeyValid();
    }
    
    // For decryption with manual key (specific cipher type selected), only validate if key is provided
    if (this.state.mode === 'decrypt' && 
        this.state.cipherType !== 'auto' && 
        this.state.keyInputMode === 'manual' && 
        this.state.key.trim() !== '' &&  // Only check if a key is provided
        !this.isKeyValid()) {
      return true;
    }

    return false;
  }

  // Render key input section based on state
  renderKeyInputSection() {
    const { mode, keyInputMode, cipherType } = this.state;

      // For decrypt mode
      if (mode === 'decrypt') {
        // For auto detection 
        if (cipherType === 'auto') {
            return null; // Return null instead of showing hint
        } else {
        // For specific cipher types in decrypt mode
          return (
            <>
              <input
                className='key-input'
                type="text"
                placeholder={this.getKeyPlaceholder()}
                value={this.state.key}
                onChange={this.handleKeyChange}
              />
              {!this.isKeyValid() && this.state.key && (
                <div className="key-hint error">
                  {cipherType === 'caesar' && "Key must be a number"}
                  {cipherType === 'substitution' && "Key must be exactly 26 letters"}
                  {cipherType === 'vigenere' && "Key must contain only letters"}
                </div>
              )}
              <div className="key-hint">
                  Leave empty to have the system find the best key for {this.getCipherTypeName(cipherType)}.
              </div>
            </>
          );
        }
    }

    // For encrypt mode
    if (mode === 'encrypt') {
      if (keyInputMode === 'manual') {
        return (
          <>
            <input
              className='key-input'
              type="text"
              placeholder={this.getKeyPlaceholder()}
              value={this.state.key}
              onChange={this.handleKeyChange}
            />
            {!this.isKeyValid() && this.state.key && (
              <div className="key-hint error">
                {cipherType === 'caesar' && "Key must be a number"}
                {cipherType === 'substitution' && "Key must be exactly 26 letters"}
                {cipherType === 'vigenere' && "Key must contain only letters"}
              </div>
            )}
          </>
        );
      }

      if (keyInputMode === 'random') {
        return (
          <>
            <div className="key-hint">
              A random key will be generated for {this.getCipherTypeName(cipherType)}.
            </div>
          </>
        );
      }
    }

    return null;
  }
  
  // get cipher type
  getCipherTypeName(type) {
    switch (type) {
      case 'caesar':
        return 'Caesar Cipher';
      case 'substitution':
        return 'Simple Substitution Cipher';
      case 'vigenere':
        return 'Vigenere Cipher';
      case 'auto':
        return 'Auto-detect';
      default:
        return type;
    }
  }
  
  // Render candidate selection UI
  renderCandidateSelector() {
    const { candidates, selectedCandidate, mode, cipherType } = this.state;
    
    // Shows for decrypt mode with auto detection and when candidates exist
    if (mode !== 'decrypt' || cipherType !== 'auto' || candidates.length === 0) {
      return null;
    }
    
    return (
      // Main container
      <div className='candidate-selector'>
        <h3>Alternate Solutions:</h3>
        <div className='candidate-list'>
          <div 
            // Check for best match
            className={`candidate-item ${selectedCandidate === -1 ? 'selected' : ''}`}
            onClick={() => this.selectCandidate(-1)}
          >
            <div className='candidate-header'>
              <span className='candidate-title'>Best Match</span>
              <span className='candidate-fitness'>
                {/* finds lowest score */}
                Score: {candidates.length > 0 ? Math.min(...candidates.map(c => parseFloat(c.fitness))) : 'N/A'}
              </span>
            </div>
          </div>
          
          {candidates.map((candidate, index) => (
            <div 
              key={index}
              className={`candidate-item ${selectedCandidate === index ? 'selected' : ''}`}
              onClick={() => this.selectCandidate(index)}
            >
              <div className='candidate-header'>
                {/* cipher type */}
                <span className='candidate-title'>{candidate.cipher}</span>
                {/* fitness */}
                <span className='candidate-fitness'>Score: {candidate.fitness} {index === 0 ? '(Best)' : ''}</span>
              </div>
              {/* key */}
              <div className='candidate-key'>Key: {candidate.key}</div>
            </div>
          ))}
        </div>
        {/*  instructions */}
        <div className='key-hint'>
          Click on a solution to view its full decryption.
        </div>
      </div>
    );
  }
     
  // UI components
  render() {
    const { mode, cipherType, keyInputMode } = this.state;

    return (
      <div className='cipher-container'>
        {/* Title */}
        <h1 className='title'>Cipher Solver</h1>
        
        {/* Connection status */}
        <div className={`connection-status ${this.state.connectionStatus.includes('Error') ? 'error' : 'success'}`}>
          {this.state.connectionStatus}
        </div>
        
        {/* Encrypt/decrypt mode selector */}
        <div className='mode-selector'>
          <label>
            <input 
              type="radio" 
              value="encrypt" 
              checked={mode === 'encrypt'} 
              onChange={this.handleModeChange} 
            />
            Encrypt
          </label>
          <label>
            <input 
              type="radio" 
              value="decrypt" 
              checked={mode === 'decrypt'} 
              onChange={this.handleModeChange} 
            />
            Decrypt
          </label>
        </div>
        
        {/* Cipher type selector */}
        <div className='cipher-type-selector'>
          <h3>Cipher Type:</h3>
          <div className='radio-group'>
            {mode === 'decrypt' && (
              <label>
                <input
                  type="radio"
                  value="auto"
                  checked={cipherType === 'auto'}
                  onChange={this.handleCipherTypeChange}
                />
                Unknown (Auto-detect)
              </label>
            )}
            <label>
              <input
                type="radio"
                value="caesar"
                checked={cipherType === 'caesar'}
                onChange={this.handleCipherTypeChange}
              />
              Caesar
            </label>
            <label>
              <input
                type="radio"
                value="substitution"
                checked={cipherType === 'substitution'}
                onChange={this.handleCipherTypeChange}
              />
              Simple Substitution
            </label>
            <label>
              <input
                type="radio"
                value="vigenere"
                checked={cipherType === 'vigenere'}
                onChange={this.handleCipherTypeChange}
              />
              Vigenere
            </label>
          </div>
        </div>

        {/* Key Input Mode Selector for encryption */}
        {mode === 'encrypt' && (
          <div className='key-mode-selector'>
            <h3>Key:</h3>
            <div className='radio-group'>
              <label>
                <input
                  type="radio"
                  value="manual"
                  checked={keyInputMode === 'manual'}
                  onChange={this.handleKeyInputModeChange}
                />
                Enter Key
              </label>
              <label>
                <input
                  type="radio"
                  value="random"
                  checked={keyInputMode === 'random'}
                  onChange={this.handleKeyInputModeChange}
                />
                Generate Random Key
              </label>
            </div>
          </div>
        )}
        
        {/* Text box for input */}
        <div className='input-container'>
          <h3>{mode === 'encrypt' ? 'Text to encrypt:' : 'Text to decrypt:'}</h3>
          <textarea
            className='text-area'
            placeholder={mode === 'encrypt' ? 'Enter plaintext to encrypt...' : 'Enter ciphertext to decrypt...'}
            value={this.state.inputText}
            onChange={this.handleInputChange}
            rows={5}
          />
        </div>
        
        {/* Key input, does not show if cipher type is auto */}
        <div className='key-container'>
          {mode === 'decrypt' && cipherType !== 'auto' ? 
          (<h3>Key (optional):</h3>) : mode === 'encrypt' && keyInputMode === 'manual' ? 
          (<h3>Key:</h3>) : null}
          {this.renderKeyInputSection()}
        </div>
        
        {/* Button to process text */}
        <div className='button-container'>
          <button 
            className='button' 
            onClick={this.handleProcess}
            disabled={this.isProcessButtonDisabled()}
          >
            {this.state.isLoading ? 'Processing...' : mode === 'encrypt' ? 'Encrypt' : 'Decrypt'}
          </button>
        </div>
        
        {/* In case of error */}
        {this.state.error && <div className='error-message'>{this.state.error}</div>}
        
        {/* display for found key */}
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
        
        {/* Candidate selector - new component */}
        {this.renderCandidateSelector()}
        
        {/* text box for the output */}
        {this.state.outputText && (
          <div className='output-container'>
            <h3>Result:</h3>
            <textarea
              className='text-area'
              value={this.state.outputText}
              readOnly
              rows={5}
            />
          </div>
        )}
        
        {/* Text box for details*/}
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
import React, { useState, useCallback } from 'react';
import alasql from 'alasql';
import './App.css';

interface QueryHistory {
  id: string;
  query: string;
  timestamp: Date;
}

interface QueryResult {
  data: any[];
  error?: string;
}

const App: React.FC = () => {
  const [jsonData, setJsonData] = useState<string>('');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [tableName, setTableName] = useState<string>('table');
  const [sqlQuery, setSqlQuery] = useState<string>('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryHistory, setQueryHistory] = useState<QueryHistory[]>([]);

  // Sample data
  const sampleData = {
    states: [
      { state: 'California', population: 39538223, region: 'West' },
      { state: 'Texas', population: 29145505, region: 'South' },
      { state: 'Florida', population: 21538187, region: 'South' },
      { state: 'New York', population: 20201249, region: 'Northeast' },
      { state: 'Pennsylvania', population: 13002700, region: 'Northeast' },
      { state: 'Illinois', population: 12812508, region: 'Midwest' },
      { state: 'Ohio', population: 11799448, region: 'Midwest' },
      { state: 'Georgia', population: 10711908, region: 'South' },
      { state: 'North Carolina', population: 10439388, region: 'South' },
      { state: 'Michigan', population: 10037261, region: 'Midwest' },
    ],
    cities: [
      { name: 'Tokyo', country: 'Japan', population: 37400068 },
      { name: 'Delhi', country: 'India', population: 29399141 },
      { name: 'Shanghai', country: 'China', population: 26317104 },
      { name: 'São Paulo', country: 'Brazil', population: 21650000 },
      { name: 'Mexico City', country: 'Mexico', population: 21581000 },
    ],
    books: [
      { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', year: 1925, genre: 'Fiction' },
      { title: 'To Kill a Mockingbird', author: 'Harper Lee', year: 1960, genre: 'Fiction' },
      { title: '1984', author: 'George Orwell', year: 1949, genre: 'Dystopian' },
      { title: 'Pride and Prejudice', author: 'Jane Austen', year: 1813, genre: 'Romance' },
      { title: 'The Catcher in the Rye', author: 'J.D. Salinger', year: 1951, genre: 'Fiction' },
    ],
  };

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setJsonData(text);
        parseJsonData(text);
      };
      reader.readAsText(file);
    }
  }, []);

  const parseJsonData = (text: string) => {
    try {
      const parsed = JSON.parse(text);
      const arrayData = Array.isArray(parsed) ? parsed : [parsed];
      setParsedData(arrayData);
      setQueryResult(null);
      setQueryHistory([]);
    } catch (error) {
      setQueryResult({
        data: [],
        error: `Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  };

  const handleJsonChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = event.target.value;
    setJsonData(text);
    if (text.trim()) {
      parseJsonData(text);
    } else {
      setParsedData([]);
      setQueryResult(null);
    }
  };

  const loadSampleData = (sample: 'states' | 'cities' | 'books') => {
    const data = sampleData[sample];
    const jsonString = JSON.stringify(data, null, 2);
    setJsonData(jsonString);
    setParsedData(data);
    setTableName(sample);
    setQueryResult(null);
    setQueryHistory([]);
  };

  const loadSampleQuery = (query: string) => {
    setSqlQuery(query);
  };

  const executeQuery = () => {
    if (!sqlQuery.trim()) {
      setQueryResult({ data: [], error: 'Please enter a SQL query' });
      return;
    }

    if (parsedData.length === 0) {
      setQueryResult({ data: [], error: 'Please load JSON data first' });
      return;
    }

    try {
      // Replace table name in query with the data array
      const modifiedQuery = sqlQuery.replace(
        new RegExp(`\\b${tableName}\\b`, 'g'),
        '?'
      );
      
      // Execute the query with data
      const result = alasql(modifiedQuery, [parsedData]);
      
      // Add to history
      const historyItem: QueryHistory = {
        id: Date.now().toString(),
        query: sqlQuery,
        timestamp: new Date(),
      };
      setQueryHistory([historyItem, ...queryHistory]);

      setQueryResult({ data: Array.isArray(result) ? result : [result] });
    } catch (error) {
      setQueryResult({
        data: [],
        error: error instanceof Error ? error.message : 'Query execution failed',
      });
    }
  };

  const clearQuery = () => {
    setSqlQuery('');
    setQueryResult(null);
  };

  const clearHistory = () => {
    setQueryHistory([]);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleUseHistoryQuery = (query: string) => {
    setSqlQuery(query);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>SQL Query Parser</h1>
        <p>
          Welcome! This tool lets you quickly explore and analyze your own JSON data using
          familiar SQL queries right in your browser, with no setup or database required.
        </p>
      </header>

      <div className="container">
        <section className="data-section">
          <h2>Paste or upload your JSON data below.</h2>
          <p>Preview your data instantly.</p>

          <div className="sample-buttons">
            <h3>Try sample JSON:</h3>
            <div className="button-group">
              <button onClick={() => loadSampleData('states')}>US States Population</button>
              <button onClick={() => loadSampleData('cities')}>World Cities</button>
              <button onClick={() => loadSampleData('books')}>Books</button>
            </div>
          </div>

          <div className="file-upload">
            <label className="upload-label">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="file-input"
              />
              <span className="upload-text">Upload File</span>
            </label>
            <span className="or-text">or</span>
            <span className="section-label">Raw JSON</span>
          </div>

          <textarea
            className="json-input"
            value={jsonData}
            onChange={handleJsonChange}
            placeholder="Paste your JSON data here..."
            rows={10}
          />

          {parsedData.length > 0 && (
            <div className="preview-section">
              <h3>Data Preview ({parsedData.length} rows)</h3>
              <div className="preview-table">
                <table>
                  <thead>
                    <tr>
                      {Object.keys(parsedData[0] || {}).map((key) => (
                        <th key={key}>{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 5).map((row, idx) => (
                      <tr key={idx}>
                        {Object.values(row).map((val, i) => (
                          <td key={i}>{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 5 && (
                  <p className="preview-note">Showing first 5 rows...</p>
                )}
              </div>
            </div>
          )}
        </section>

        <section className="query-section">
          <h2>Write an SQL query and click Execute Query.</h2>
          <p>See results, errors, and your query history—all in one place!</p>

          <div className="sample-queries">
            <h3>Try sample SQL:</h3>
            <div className="button-group">
              <button onClick={() => loadSampleQuery(`SELECT * FROM ${tableName}`)}>
                All {tableName}
              </button>
              <button
                onClick={() =>
                  loadSampleQuery(`SELECT * FROM ${tableName} WHERE population > 20000000`)
                }
              >
                {tableName === 'states' ? 'States with pop > 20M' : 'Filtered data'}
              </button>
              {tableName === 'states' && (
                <button
                  onClick={() =>
                    loadSampleQuery(`SELECT state FROM ${tableName} WHERE region = 'South'`)
                  }
                >
                  States in the South
                </button>
              )}
            </div>
          </div>

          <div className="query-editor">
            <textarea
              className="sql-input"
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              placeholder="SELECT * FROM table WHERE ..."
              rows={5}
            />
            <div className="query-buttons">
              <button className="execute-btn" onClick={executeQuery}>
                Execute Query
              </button>
              <button className="clear-btn" onClick={clearQuery}>
                Clear Query
              </button>
            </div>
          </div>

          {queryResult && (
            <div className="results-section">
              {queryResult.error ? (
                <div className="error-message">
                  <h3>Error:</h3>
                  <p>{queryResult.error}</p>
                </div>
              ) : (
                <div className="results-table">
                  <div className="results-header">
                    <h3>Results ({queryResult.data.length} rows)</h3>
                    <button
                      onClick={() =>
                        copyToClipboard(JSON.stringify(queryResult.data, null, 2))
                      }
                    >
                      Copy to Clipboard
                    </button>
                  </div>
                  {queryResult.data.length > 0 && (
                    <table>
                      <thead>
                        <tr>
                          {Object.keys(queryResult.data[0]).map((key) => (
                            <th key={key}>{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {queryResult.data.map((row, idx) => (
                          <tr key={idx}>
                            {Object.values(row).map((val, i) => (
                              <td key={i}>{String(val)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          )}

          {queryHistory.length > 0 && (
            <div className="history-section">
              <div className="history-header">
                <h3>Query History</h3>
                <button className="clear-btn" onClick={clearHistory}>
                  Clear History
                </button>
              </div>
              <ul className="history-list">
                {queryHistory.map((item) => (
                  <li key={item.id} className="history-item">
                    <div className="history-query">
                      <code>{item.query}</code>
                      <span className="history-time">
                        {item.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <button
                      className="use-query-btn"
                      onClick={() => handleUseHistoryQuery(item.query)}
                    >
                      Use
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default App;


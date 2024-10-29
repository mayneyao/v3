import { Editor } from "@/components/Editor";

function App() {
  const initialCode = `
import { useState } from 'react';
import { Button } from "@/components/ui/button"

export default function MyComponent() {
  const [count, setCount] = useState(0);
  return (
    <div className="container" style={{ padding: '2rem' }}>
      <h1 className="title">
        A realtime react component renderer, totally run in your browser
      </h1>
      <div className="p-4 bg-blue-500 text-white">Hello Tailwind!</div>
      <p>Count: {count}</p>
      <div className="flex gap-2">
        <button 
          onClick={() => setCount(prev => prev + 1)}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.25rem',
            border: 'none',
            background: '#0070f3',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          Increment
        </button>
        <Button onClick={() => setCount(count - 1)}>Decrement</Button>
      </div>
    </div>
  );
};
`;

  return <Editor initialCode={initialCode} />;
}

export default App;

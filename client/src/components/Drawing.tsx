// src/components/Drawing.tsx
import React, { useRef, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import './Drawing.css';

interface DrawingProps {
  socket: Socket;
  onBackToLobby: () => void;
}

interface DrawData {
  offsetX: number;
  offsetY: number;
  color: string;
}

const Drawing: React.FC<DrawingProps> = ({ socket, onBackToLobby }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');

  // Set up listeners for drawing events from other users
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    
    const onDrawingStart = ({ offsetX, offsetY, color: userColor }: DrawData) => {
      if (context) {
        context.strokeStyle = userColor;
        context.beginPath();
        context.moveTo(offsetX, offsetY);
      }
    };
    
    const onDrawing = ({ offsetX, offsetY }: DrawData) => {
      if (context) {
        context.lineTo(offsetX, offsetY);
        context.stroke();
      }
    };

    const onDrawingStop = () => {
      if (context) {
        context.closePath();
      }
    };
    
    const onClear = () => {
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    socket.on('drawing:start', onDrawingStart);
    socket.on('drawing:draw', onDrawing);
    socket.on('drawing:stop', onDrawingStop);
    socket.on('drawing:clear', onClear);

    return () => {
      socket.off('drawing:start', onDrawingStart);
      socket.off('drawing:draw', onDrawing);
      socket.off('drawing:stop', onDrawingStop);
      socket.off('drawing:clear', onClear);
    };
  }, [socket]);

  useEffect(() => {
    // Update context settings when color changes
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.lineCap = 'round';
    context.lineWidth = 5;
    context.strokeStyle = color;
  }, [color]);

  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    
    const { offsetX, offsetY } = event.nativeEvent;
    context.beginPath();
    context.moveTo(offsetX, offsetY);
    setIsDrawing(true);
    socket.emit('drawing:start', { offsetX, offsetY, color });
  };

  const draw = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const { offsetX, offsetY } = event.nativeEvent;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.lineTo(offsetX, offsetY);
    context.stroke();
    socket.emit('drawing:draw', { offsetX, offsetY, color });
  };

  const stopDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.closePath();
    setIsDrawing(false);
    socket.emit('drawing:stop');
  };
  
  const handleClearCanvas = () => {
    socket.emit('drawing:clear');
  };

  return (
    <div>
      <button onClick={onBackToLobby}>Back to Lobby</button>
      <h2>Drawing Canvas</h2>
      <div className="controls">
        <label htmlFor="color-picker">Color:</label>
        <input 
          id="color-picker" 
          type="color" 
          value={color} 
          onChange={(e) => setColor(e.target.value)} 
        />
        <button onClick={handleClearCanvas}>Clear</button>
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
    </div>
  );
};

export default Drawing;

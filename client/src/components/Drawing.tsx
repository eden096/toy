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
  userId?: string;
}

const Drawing: React.FC<DrawingProps> = ({ socket, onBackToLobby }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selfLastRef = useRef<{ x: number; y: number } | null>(null);
  const peersRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');

  const getCanvasPoint = (evt: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (evt.clientX - rect.left) * scaleX,
      y: (evt.clientY - rect.top) * scaleY,
    };
  };

  // Set up listeners for drawing events from other users
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    
    const onDrawingStart = ({ offsetX, offsetY, color: userColor, userId }: DrawData) => {
      if (!userId || !context) return;
      context.strokeStyle = userColor;
      peersRef.current.set(userId, { x: offsetX, y: offsetY });
      context.beginPath();
      context.moveTo(offsetX, offsetY);
    };
    
    const onDrawing = ({ offsetX, offsetY, color: userColor, userId }: DrawData) => {
      if (!userId || !context) return;
      const last = peersRef.current.get(userId);
      context.strokeStyle = userColor;
      context.beginPath();
      if (last) {
        context.moveTo(last.x, last.y);
      } else {
        context.moveTo(offsetX, offsetY);
      }
      context.lineTo(offsetX, offsetY);
      context.stroke();
      peersRef.current.set(userId, { x: offsetX, y: offsetY });
    };

    const onDrawingStop = ({ userId }: { userId?: string }) => {
      if (userId) {
        peersRef.current.delete(userId);
      }
      if (context) {
        context.closePath();
      }
    };
    
    const onClear = () => {
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        peersRef.current.clear();
        selfLastRef.current = null;
        context.beginPath();
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
    
    const point = getCanvasPoint(event.nativeEvent);
    if (!point) return;
    context.strokeStyle = color;
    context.beginPath();
    context.moveTo(point.x, point.y);
    selfLastRef.current = { x: point.x, y: point.y };
    setIsDrawing(true);
    socket.emit('drawing:start', { offsetX: point.x, offsetY: point.y, color, userId: socket.id });
  };

  const draw = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const point = getCanvasPoint(event.nativeEvent);
    if (!point) return;

    context.strokeStyle = color;
    context.beginPath();
    if (selfLastRef.current) {
      context.moveTo(selfLastRef.current.x, selfLastRef.current.y);
    } else {
      context.moveTo(point.x, point.y);
    }
    context.lineTo(point.x, point.y);
    context.stroke();
    selfLastRef.current = { x: point.x, y: point.y };
    socket.emit('drawing:draw', { offsetX: point.x, offsetY: point.y, color, userId: socket.id });
  };

  const stopDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.closePath();
    selfLastRef.current = null;
    setIsDrawing(false);
    socket.emit('drawing:stop', { userId: socket.id });
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

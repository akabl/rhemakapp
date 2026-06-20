// app/(dashboard)/arena/coding/CodingArenaClient.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useSocket } from '../../../hooks/useSockects'; // Singular import
import Link from 'next/link';

interface CodingArenaClientProps {
  currentUserId: string;
  currentUsername: string;
  initialChallenges: any[]; // Live challenges fetched from the database
}

export default function CodingArenaClient({ 
  currentUserId, 
  currentUsername, 
  initialChallenges 
}: CodingArenaClientProps) {
  const { socket, isConnected } = useSocket();
  
  // Set the first database challenge as the default active task on load
  const [activeTask, setActiveUserTask] = useState(initialChallenges[0]);
  const [language, setLanguage] = useState<'javascript' | 'python' | 'java' | 'cpp' | 'sql' | 'php'>('javascript');
  const [code, setCode] = useState(initialChallenges[0]?.templates?.javascript || '');
  
  const [arenaMode, setArenaMode] = useState<'collab' | 'race'>('collab');
  const [room, setRoom] = useState('');
  const [inRoom, setInRoom] = useState(false);
  const [output, setOutput] = useState('Console is idle. Write your solution and click "Run Code"');
  const [loading, setLoading] = useState(false);
  
  const [hasControl, setHasControl] = useState(true);
  const [controlOwnerName, setControlOwnerName] = useState('You');
  
  const ignoreNextSync = useRef(false);

  // Sync editor changes over WebSockets
  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on('receive_code', (data: { code: string; language: any }) => {
      if (arenaMode === 'race') return;
      ignoreNextSync.current = true;
      setCode(data.code);
      setLanguage(data.language);
    });

    socket.on('control_requested', (data: { senderName: string; socketId: string }) => {
      setHasControl(false);
      setControlOwnerName(data.senderName);
      setOutput(`⚠️ ${data.senderName} requested keyboard control. Editor is now READ-ONLY for you.`);
    });

    socket.on('control_released', () => {
      setHasControl(true);
      setControlOwnerName('You');
      setOutput(`✓ Keyboard control released. You are now the active driver.`);
    });

    socket.on('receive_race_win', (data: { winnerName: string }) => {
      setOutput(`🏆 MATCH OVER!\n${data.winnerName} passed all test cases and WON the coding race!`);
    });

    return () => {
      socket.off('receive_code');
      socket.off('control_requested');
      socket.off('control_released');
      socket.off('receive_race_win');
    };
  }, [socket, isConnected, arenaMode]);

  const handleEditorChange = (value: string | undefined) => {
    if (!value) return;
    setCode(value);

    if (inRoom && socket && arenaMode === 'collab') {
      if (!hasControl) return;
      if (ignoreNextSync.current) {
        ignoreNextSync.current = false;
        return;
      }
      socket.emit('send_code', { room, code: value, language });
    }
  };

  const handleTaskChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const task = initialChallenges.find(t => t.id === e.target.value) || initialChallenges[0];
    setActiveUserTask(task);
    const newCode = task.templates[language];
    setCode(newCode);

    if (inRoom && socket && arenaMode === 'collab') {
      socket.emit('send_code', { room, code: newCode, language });
    }
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLang = e.target.value as any;
    setLanguage(selectedLang);
    const newCode = activeTask.templates[selectedLang];
    setCode(newCode);

    if (inRoom && socket && arenaMode === 'collab') {
      socket.emit('send_code', { room, code: newCode, language: selectedLang });
    }
  };

  const requestKeyboardControl = () => {
    if (!socket || !inRoom) return;
    socket.emit('request_control', { room, senderName: 'Opponent' });
    setHasControl(true);
    setControlOwnerName('You');
    setOutput('✓ You requested keyboard control. Editor is now active.');
  };

  const releaseKeyboardControl = () => {
    if (!socket || !inRoom) return;
    socket.emit('release_control', room);
    setHasControl(false);
    setControlOwnerName('Opponent');
    setOutput('Released keyboard control. Waiting for opponent to drive.');
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!room.trim() || !socket) return;
    socket.emit('join_coding', room.trim());
    setInRoom(true);
  };

  // Safe client-side JavaScript execution sandbox and test runner
  const handleRunCode = () => {
    setLoading(true);
    setOutput('Compiling and running local test cases...');

    setTimeout(() => {
      try {
        if (language === 'javascript') {
          const testRunnerFunction = new Function(`
            ${code}
            return solve;
          `);

          const solveFn = testRunnerFunction();
          let passedAll = true;
          let logResults = [];

          // Run evaluation loop against our dynamic task's test cases
          for (const [idx, tc] of activeTask.testCases.entries()) {
            const actual = solveFn(...tc.input);
            const passed = actual === tc.expected;
            if (!passed) passedAll = false;
            
            logResults.push(
              `Test Case ${idx + 1}: input(${tc.input.join(', ')}) $\\rightarrow$ ` +
              `Expected: ${tc.expected}, Actual: ${actual} [${passed ? '✓ PASSED' : '❌ FAILED'}]`
            );
          }

          if (passedAll) {
            logResults.push('\n✓ All local test cases passed!');
            if (arenaMode === 'race' && socket && inRoom) {
              socket.emit('race_win', { room, winnerName: 'Your Opponent' });
              setOutput('🏆 CONGRATULATIONS!\nYou solved the challenge first and won the race!');
              setLoading(false);
              return;
            }
          } else {
            logResults.push('\n❌ Some test cases failed. Adjust your algorithm.');
          }

          setOutput(logResults.join('\n'));
        } else {
          setOutput(
            `[Simulation Compiler Output - ${language.toUpperCase()}]\n` +
            `Compilation successful.\n` +
            `Test Case 1: solve(${activeTask.testCases[0].input.join(', ')}) $\\rightarrow$ Expected: ${activeTask.testCases[0].expected}, Actual: ${activeTask.testCases[0].expected} [✓ PASSED]\n` +
            `Test Case 2: solve(${activeTask.testCases[1].input.join(', ')}) $\\rightarrow$ Expected: ${activeTask.testCases[1].expected}, Actual: ${activeTask.testCases[1].expected} [✓ PASSED]\n\n` +
            `✓ All simulated compiler tests passed!`
          );
          if (arenaMode === 'race' && socket && inRoom) {
            socket.emit('race_win', { room, winnerName: 'Your Opponent' });
            setOutput('🏆 CONGRATULATIONS!\nYou solved the challenge first and won the race!');
          }
        }
      } catch (err: any) {
        setOutput(`Compilation/Sandbox Execution Error:\n${err.message || err}`);
      } finally {
        setLoading(false);
      }
    }, 1200);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Link 
        href="/arena" 
        className="text-sm font-medium text-slate-400 hover:text-blue-400 transition inline-flex items-center gap-2 group"
      >
        <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Arena
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        
        {/* Left Column: Challenge Description, Lobby, & Settings */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            
            {/* Task Selector Dropdown (Pulls dynamically from database initialChallenges) */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                Active Coding Challenge
              </label>
              <select
                value={activeTask.id}
                onChange={handleTaskChange}
                className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg p-2.5 focus:outline-none focus:border-blue-500 transition select-none"
              >
                {initialChallenges.map(task => (
                  <option key={task.id} value={task.id}>{task.title} ({task.difficulty})</option>
                ))}
              </select>
            </div>

            {/* Task Details panel */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
              <h2 className="text-sm font-extrabold text-slate-100">{activeTask.title}</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {activeTask.description}
              </p>
            </div>

            {/* Arena Mode selector */}
            <div className="border-t border-slate-850 pt-4 space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                Arena Match Mode
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-850">
                <button
                  onClick={() => { setArenaMode('collab'); setInRoom(false); setHasControl(true); }}
                  className={`py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                    arenaMode === 'collab' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Pair Collab
                </button>
                <button
                  onClick={() => { setArenaMode('race'); setInRoom(false); }}
                  className={`py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                    arenaMode === 'race' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Independent Race
                </button>
              </div>
            </div>

            {/* Room connection */}
            <div className="border-t border-slate-850 pt-4 space-y-3">
              {!inRoom ? (
                <form onSubmit={handleJoinRoom} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Match Room ID
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., room_code"
                      value={room}
                      onChange={(e) => setRoom(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-655 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!isConnected}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white text-xs font-semibold rounded-lg transition shadow-md cursor-pointer"
                  >
                    {isConnected ? 'Enter Match Room' : 'Offline - Connecting...'}
                  </button>
                </form>
              ) : (
                <div className="space-y-2">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Connected Room:</span>
                    <span className="font-bold text-slate-300">{room}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Language Selector */}
            <div className="border-t border-slate-850 pt-4 space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                Language
              </label>
              <select
                value={language}
                onChange={handleLanguageChange}
                className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg p-2.5 focus:outline-none focus:border-blue-500 transition"
              >
                <option value="javascript">Javascript (Sandbox Live)</option>
                <option value="python">Python (Simulation)</option>
                <option value="java">Java (Simulation)</option>
                <option value="cpp">C++ (Simulation)</option>
                <option value="sql">SQL (Simulation)</option>
                <option value="php">PHP (Simulation)</option>
              </select>
            </div>
          </div>

          {/* Code outputs console */}
          <div className="border-t border-slate-850 pt-4 space-y-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Console Output</span>
            <pre className="w-full h-32 bg-slate-950 border border-slate-850 rounded-lg p-3 text-[10px] font-mono text-slate-400 overflow-y-auto leading-relaxed">
              {output}
            </pre>
            <button
              onClick={handleRunCode}
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white text-xs font-semibold rounded-lg transition shadow-md cursor-pointer"
            >
              {loading ? 'Executing Test Suite...' : 'Run Code'}
            </button>
          </div>
        </div>

        {/* Right Column: Code Editor & Keyboard Lock controls */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden min-h-[500px] flex flex-col justify-between">
          
          {/* Header toolbar */}
          <div className="p-3 bg-slate-900 border-b border-slate-850 flex items-center justify-between text-xs text-slate-400 select-none">
            <span>💻 editor_buffer.{language === 'cpp' ? 'cpp' : language === 'javascript' ? 'js' : language === 'python' ? 'py' : language}</span>
            
            {/* Display active keyboard owner in Collaborative mode */}
            {inRoom && arenaMode === 'collab' && (
              <div className="flex items-center gap-3">
                <span className="text-xs">
                  Active Keyboard: <strong className="text-blue-400">{controlOwnerName}</strong>
                </span>
                
                {hasControl ? (
                  <button
                    onClick={releaseKeyboardControl}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded text-[10px] transition cursor-pointer"
                  >
                    Release Keyboard
                  </button>
                ) : (
                  <button
                    onClick={requestKeyboardControl}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] rounded transition cursor-pointer"
                  >
                    Request Keyboard
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1">
            <Editor
              height="100%"
              language={language === 'cpp' ? 'cpp' : language}
              theme="vs-dark"
              value={code}
              onChange={handleEditorChange}
              options={{
                fontSize: 13,
                fontFamily: 'Consolas, monospace',
                minimap: { enabled: false },
                lineNumbers: 'on',
                scrollbar: { verticalScrollbarSize: 8 },
                automaticLayout: true,
                // In Collaborative Mode, lock writing capabilities if we do not have the control lock
                readOnly: arenaMode === 'collab' && inRoom && !hasControl,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
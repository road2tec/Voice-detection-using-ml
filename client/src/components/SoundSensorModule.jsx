import React, { useState, useEffect, useRef } from 'react';

const SoundSensorModule = () => {
  const [isActive, setIsActive] = useState(false);
  const [volume, setVolume] = useState(0);
  const [status, setStatus] = useState('SYSTEM READY');
  const [isNoisy, setIsNoisy] = useState(false);

  const audioContextRef = useRef(null);
  const analyzerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const streamRef = useRef(null);

  const startSensor = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 256;
      source.connect(analyzer);
      analyzerRef.current = analyzer;

      const dataArray = new Uint8Array(analyzer.frequencyBinCount);
      setIsActive(true);

      const update = () => {
        if (!analyzerRef.current) return;
        analyzerRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        let average = sum / dataArray.length;
        let vol = Math.min(average * 2, 100);

        setVolume(vol);

        if (vol > 30) {
          setIsNoisy(true);
          setStatus('NOISE DETECTED');
        } else {
          setIsNoisy(false);
          setStatus('STATUS: QUIET');
        }

        animationFrameRef.current = requestAnimationFrame(update);
      };

      update();
    } catch (err) {
      alert("Microphone access denied or not supported.");
      console.error(err);
    }
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="flex justify-center items-center py-6 bg-slate-950/20 rounded-2xl border border-slate-800">
      <div className="bg-[#252525] p-10 rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-2 border-[#333] text-center w-[400px] text-white">
        {/* LCD Display */}
        <div className="bg-[#1a2e1a] border-[8px] border-black rounded-sm p-5 mb-8 shadow-[inset_0_0_15px_rgba(0,0,0,1)]">
          <div 
            className={`font-mono text-xl uppercase tracking-[2px] transition-all duration-300 ${isNoisy ? 'text-[#ff4d4d] shadow-[0_0_8px_#ff4d4d]' : 'text-[#00ff41] shadow-[0_0_8px_#00ff41]'}`}
          >
            {status}
          </div>
        </div>

        {/* Hardware Components Row */}
        <div className="flex justify-around items-end mb-8 gap-4">
          <div className="flex-1">
            <div className="w-4/5 h-[15px] bg-[#111] mx-auto my-2.5 rounded-[10px] overflow-hidden border border-[#444]">
              <div 
                className="h-full bg-gradient-to-r from-[#2ecc71] via-[#f1c40f] to-[#e74c3c] transition-[width] duration-100 ease-out"
                style={{ width: `${volume}%` }}
              ></div>
            </div>
            <div className="text-[0.8rem] text-[#888] mt-1 uppercase">Sound Sensor</div>
          </div>

          <div className="flex-1">
            <div 
              className={`w-[60px] h-[60px] rounded-[50%_50%_45%_45%] mx-auto mb-2.5 relative transition-all duration-100 border-2 border-[#222] ${isNoisy ? 'bg-[#fff350] shadow-[0_0_40px_#ffeb3b,0_0_80px_#fbc02d]' : 'bg-[#444]'}`}
            ></div>
            <div className="text-[0.8rem] text-[#888] mt-1 uppercase">AC Bulb Load</div>
          </div>
        </div>

        <button 
          onClick={startSensor}
          disabled={isActive}
          className={`font-bold py-3 px-6 rounded-md transition-colors duration-300 w-full ${isActive ? 'bg-[#2ecc71] cursor-default' : 'bg-[#e74c3c] hover:bg-[#c0392b]'}`}
        >
          {isActive ? 'SENSOR ACTIVE' : 'ACTIVATE SENSOR'}
        </button>
        <p className="text-[0.7rem] text-[#666] mt-[15px]">Click to use microphone for real-time sensing</p>
      </div>
    </div>
  );
};

export default SoundSensorModule;

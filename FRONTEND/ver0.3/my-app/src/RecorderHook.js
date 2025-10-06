import { useEffect, useRef, useState } from "react";


//Запись стартует при изменении voiceMod стейта, а завершается при вызове функции остановки
//желательно привести старт и окончание к единому виду (либо все от стейта, либо все явным вызовом)
function useRecorder(voiceMod, canvasRef, onStopCallback) {
    const audioChunksRef = useRef([]);
    const recorderRef = useRef(null);
    const analyserRef = useRef(null);

    const shouldRenderRef = useRef(true);
    const isCancelledRef = useRef(false);
    const animationRef = useRef(null);
    const audioContextRef = useRef(null);

    /*
    useEffect(() => {
        if (!voiceMod) return;

        const startRecording = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
                recorderRef.current = recorder;
                audioChunksRef.current = [];

                recorder.ondataavailable = (e) => {
                    audioChunksRef.current.push(e.data);
                    console.log("Got data:", e.data, "size:", e.data.size);
                };

                recorder.onstop = () => {
                    if (onStopCallback) onStopCallback(audioChunksRef.current, stream);
                };

                recorder.start();
                //ограничение по времени
                const MAX_DURATION_MS = 30000; // например, 10 секунд
                setTimeout(() => {
                    if (recorder.state === 'recording') {
                        console.log('Достигнут лимит времени, записи');
                        recorder.stop();
                    }
                }, MAX_DURATION_MS);






                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const source = ctx.createMediaStreamSource(stream);
                const analyser = ctx.createAnalyser();
                analyser.fftSize = 2048;
                source.connect(analyser);
                analyserRef.current = analyser;

                const canvas = canvasRef.current;
                canvas.width = canvas.offsetWidth;
                canvas.height = canvas.offsetHeight;

                const cCtx = canvas.getContext("2d");

                

                const renderWave = () => {
                    if(!shouldRender) return;
                    const rootStyles = getComputedStyle(document.documentElement);
                    const bgColor = rootStyles.getPropertyValue('--bg-input').trim();

                    const buffer = new Uint8Array(analyser.fftSize);
                    analyser.getByteTimeDomainData(buffer);

                    cCtx.fillStyle = bgColor;
                    cCtx.fillRect(0, 0, canvas.width, canvas.height);
                    cCtx.lineWidth = 2;
                    cCtx.strokeStyle = "#00ff99";
                    cCtx.beginPath();

                    const slice = canvas.width / buffer.length;
                    buffer.forEach((v, i) => {
                        const y = (v / 128) * (canvas.height / 2);
                        const x = i * slice;
                        i === 0 ? cCtx.moveTo(x, y) : cCtx.lineTo(x, y);
                    });
                    cCtx.stroke();

                    requestAnimationFrame(renderWave);
                };

                renderWave();

                return () => {
                    shouldRender = false;
                    analyserRef.current?.disconnect();
                    recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
                    recorderRef.current = null;
                    analyserRef.current = null;
                    audioChunksRef.current = [];
                };
            }
            catch (err) {
                console.error(err);
            }
            
        };

        startRecording();
    }, [voiceMod]);
*/

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
            recorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (e) => {
                audioChunksRef.current.push(e.data);
                console.log("Got data:", e.data, "size:", e.data.size);
            };

            recorder.onstop = () => {
                if (isCancelledRef.current) {
                    console.log("Запись была отменена, onStopCallback не вызывается.");
                    isCancelledRef.current = false;
                    return;
                }
                if (onStopCallback) onStopCallback(audioChunksRef.current, stream);

                audioChunksRef.current = [];
            };

            recorder.start();
            //ограничение по времени
            const MAX_DURATION_MS = 30000;
            setTimeout(() => {
                if (recorder.state === 'recording' && !isCancelledRef.current) {
                    console.log('Достигнут лимит времени, записи');
                    recorder.stop();
                    stopRecording();
                }
            }, MAX_DURATION_MS);






            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            audioContextRef.current = ctx;
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 2048;
            source.connect(analyser);
            analyserRef.current = analyser;

            const canvas = canvasRef.current;
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;

            const cCtx = canvas.getContext("2d");

            

            const renderWave = () => {
                if (!shouldRenderRef.current) return;
                const rootStyles = getComputedStyle(document.documentElement);
                const bgColor = rootStyles.getPropertyValue('--bg-input').trim();

                const buffer = new Uint8Array(analyser.fftSize);
                analyser.getByteTimeDomainData(buffer);

                cCtx.fillStyle = bgColor;
                cCtx.fillRect(0, 0, canvas.width, canvas.height);
                cCtx.lineWidth = 2;
                cCtx.strokeStyle = "#00ff99";
                cCtx.beginPath();

                const slice = canvas.width / buffer.length;
                buffer.forEach((v, i) => {
                    const y = (v / 128) * (canvas.height / 2);
                    const x = i * slice;
                    i === 0 ? cCtx.moveTo(x, y) : cCtx.lineTo(x, y);
                });
                cCtx.stroke();
                animationRef.current = requestAnimationFrame(renderWave);
                //requestAnimationFrame(renderWave);
            };
            shouldRenderRef.current = true;
            renderWave();
        }
        catch(e) {
            console.error(e);
        }
    };

    const stopRecording = () => {
        console.log("Остановка записи. VoiceMod: ", voiceMod);
        if (recorderRef.current && recorderRef.current.state !== "inactive") {
            recorderRef.current.stop();
            shouldRenderRef.current = false;
            analyserRef.current?.disconnect();
            recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
            recorderRef.current = null;
            analyserRef.current = null;
            //audioChunksRef.current = [];
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
            audioContextRef.current?.close();
            audioContextRef.current = null;

        }
    };

    const cancelRecording = () => {
        console.log("Отмена записи. VoiceMod:", voiceMod);
        isCancelledRef.current = true;

        if (recorderRef.current && recorderRef.current.state !== "inactive") {
            recorderRef.current.stop();
        }

        shouldRenderRef.current = false;
        analyserRef.current?.disconnect();
        recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
        recorderRef.current = null;
        analyserRef.current = null;
        audioChunksRef.current = [];

        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }

        audioContextRef.current?.close();
        audioContextRef.current = null;

    };


    return { startRecording, stopRecording, cancelRecording };
}

export default useRecorder;

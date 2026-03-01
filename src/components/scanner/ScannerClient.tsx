'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useCardRecognition } from '@/hooks/useCardRecognition';
import { ScannerOverlay } from './ScannerOverlay';
import { RecognitionResults } from './RecognitionResults';
import { ScannerTips } from './ScannerTips';
import { Button } from '@/components/ui/button';

type CameraState = 'idle' | 'requesting' | 'active' | 'error';

interface CameraDevice {
  deviceId: string;
  label: string;
}

export function ScannerClient() {
  const t = useTranslations('Scanner');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [cameraError, setCameraError] = useState<string>('');
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [videoReady, setVideoReady] = useState(false);

  const { state, start, stop, isUsingWorker } = useCardRecognition();

  const enumerateDevices = useCallback(async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices
        .filter((d) => d.kind === 'videoinput')
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${d.deviceId.slice(0, 8)}`,
        }));
      setDevices(videoDevices);
    } catch {
      // Enumeration failed, continue with default camera
    }
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const assignStreamToVideo = useCallback((stream: MediaStream) => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    void video.play().catch(() => {
      // autoPlay usually handles this, explicit play() as fallback
    });
  }, []);

  const startCamera = useCallback(async (deviceId?: string) => {
    setCameraState('requesting');
    setCameraError('');
    setVideoReady(false);

    // Stop existing stream before starting a new one
    stopStream();

    const videoConstraints: MediaTrackConstraints = {
      width: { ideal: 1280 },
      height: { ideal: 720 },
    };

    if (deviceId) {
      videoConstraints.deviceId = { exact: deviceId };
    } else {
      videoConstraints.facingMode = 'environment';
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });

      streamRef.current = mediaStream;
      setCameraState('active');

      // Enumerate devices after permission is granted (labels become available)
      await enumerateDevices();
    } catch (err) {
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          setCameraError(t('cameraPermissionDenied'));
        } else if (err.name === 'NotFoundError') {
          setCameraError(t('noCameraFound'));
        } else if (err.name === 'NotReadableError') {
          setCameraError(t('cameraInUse'));
        } else {
          setCameraError(t('cameraError'));
        }
      } else {
        setCameraError(t('cameraError'));
      }
      setCameraState('error');
    }
  }, [t, enumerateDevices, stopStream]);

  const stopCamera = useCallback(() => {
    stop();
    stopStream();
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setVideoReady(false);
    setCameraState('idle');
  }, [stop, stopStream]);

  const handleDeviceChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDeviceId = e.target.value;
    setSelectedDeviceId(newDeviceId);
    stop();
    void startCamera(newDeviceId || undefined);
  }, [stop, startCamera]);

  const handleToggleRecognition = useCallback(() => {
    if (state.isActive) {
      stop();
    } else {
      void start(videoRef);
    }
  }, [state.isActive, start, stop]);

  // Assign stream to video element when both are ready
  // This useEffect fires after the render that mounts <video> (cameraState=active)
  useEffect(() => {
    if (cameraState === 'active' && streamRef.current) {
      assignStreamToVideo(streamRef.current);
    }
  }, [cameraState, assignStreamToVideo]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stop]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Video + Overlay */}
      <div className="lg:col-span-2">
        <div className="relative overflow-hidden rounded-xl bg-muted">
          {cameraState === 'idle' && (
            <div className="flex aspect-video flex-col items-center justify-center gap-4 p-8">
              <p className="text-center text-sm text-muted-foreground">
                {t('cameraPermission')}
              </p>
              <Button onClick={() => void startCamera()} size="lg">
                {t('accessCamera')}
              </Button>
            </div>
          )}

          {cameraState === 'requesting' && (
            <div className="flex aspect-video flex-col items-center justify-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted-foreground/30 border-t-primary" />
              <p className="text-sm text-muted-foreground">{t('loading')}</p>
            </div>
          )}

          {cameraState === 'error' && (
            <div className="flex aspect-video flex-col items-center justify-center gap-4 p-8">
              <p className="text-center text-sm text-destructive">
                {cameraError}
              </p>
              <Button variant="outline" onClick={() => void startCamera()}>
                {t('retry')}
              </Button>
            </div>
          )}

          {cameraState === 'active' && (
            <>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                onLoadedMetadata={() => setVideoReady(true)}
                className="aspect-video w-full object-cover"
              />
              {videoReady && (
                <ScannerOverlay
                  state={state}
                  isActive={state.isActive}
                  isUsingWorker={isUsingWorker}
                  onToggle={handleToggleRecognition}
                  videoWidth={videoRef.current?.videoWidth}
                  videoHeight={videoRef.current?.videoHeight}
                />
              )}
            </>
          )}
        </div>

        {/* Camera controls */}
        {cameraState === 'active' && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {devices.length > 0 && (
              <select
                value={selectedDeviceId}
                onChange={handleDeviceChange}
                className="rounded-md border border-border bg-card px-3 py-1.5 text-sm"
                aria-label={t('selectCamera')}
              >
                <option value="">{t('defaultCamera')}</option>
                {devices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>
            )}
            <Button variant="outline" size="sm" onClick={stopCamera}>
              {t('stopCamera')}
            </Button>
          </div>
        )}

        <ScannerTips />
      </div>

      {/* Results panel */}
      <div className="lg:col-span-1">
        <RecognitionResults
          lastResult={state.lastResult}
          topCandidates={state.topCandidates}
          identifiedCards={state.identifiedCards}
        />
      </div>
    </div>
  );
}

import React, { useContext, useMemo } from "react";
import { useParams } from "react-router-dom";
import { AppContext } from "../context/AppContext";

const VideoCall = () => {
  const { appointmentId } = useParams();
  const { userData } = useContext(AppContext);

  const displayName = useMemo(() => {
    return userData && userData.name
      ? encodeURIComponent(userData.name)
      : "Guest";
  }, [userData]);

  const roomName = useMemo(() => {
    return `prescripto-${appointmentId}`;
  }, [appointmentId]);

  const jitsiUrl = useMemo(() => {
    return `https://meet.jit.si/${roomName}#userInfo.displayName=%22${displayName}%22`;
  }, [roomName, displayName]);

  return (
    <div className="w-full h-[80vh] mt-6">
      <iframe
        title="Video Conference"
        src={jitsiUrl}
        allow="camera; microphone; fullscreen; display-capture; autoplay"
        className="w-full h-full rounded-lg border"
      />
    </div>
  );
};

export default VideoCall;

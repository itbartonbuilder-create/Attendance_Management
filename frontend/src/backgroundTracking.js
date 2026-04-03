import BackgroundGeolocation from "@transistorsoft/capacitor-background-geolocation";
import API from "./api";

let locationSub = null;
let heartbeatSub = null;

export const startTracking = async () => {
  console.log("🚀 Initializing BG tracking");

  const state = await BackgroundGeolocation.ready({
    desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
    distanceFilter: 10,
    stopOnTerminate: false,
    startOnBoot: true,
    foregroundService: true,
    heartbeatInterval: 60,
    locationAuthorizationRequest: "Always",
    notification: {
      title: "Live Tracking Active",
      text: "Your location is being tracked",
    },
  });

  console.log("BG State:", state.enabled);

  if (locationSub) locationSub.remove();
  if (heartbeatSub) heartbeatSub.remove();


  locationSub = BackgroundGeolocation.onLocation(async (location) => {
    try {
      console.log("📍 Movement:", location.coords);

     const user = JSON.parse(localStorage.getItem("user"));

await API.post("/update-location", {
  latitude: location.coords.latitude,
  longitude: location.coords.longitude,
  userId: user._id,
  role: user.role,
});
      console.log("🌍 Movement sent");
    } catch (e) {
      console.log("❌ Movement error", e);
    }
  });

 
  heartbeatSub = BackgroundGeolocation.onHeartbeat(async () => {
    try {
      console.log("💓 Heartbeat");

      const location = await BackgroundGeolocation.getCurrentPosition({
        samples: 1,
        persist: true,
      });

     const user = JSON.parse(localStorage.getItem("user"));

await API.post("/update-location", {
  latitude: location.coords.latitude,
  longitude: location.coords.longitude,
  userId: user._id,
  role: user.role,
});

      console.log("💓 Idle sent");
    } catch (e) {
      console.log("❌ Heartbeat error", e);
    }
  });


  if (!state.enabled) {
    await BackgroundGeolocation.start();
    console.log("✅ Tracking STARTED");
  } else {
    console.log("🟢 Tracking already ON");
  }
};

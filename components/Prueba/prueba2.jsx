import React, { useState, useEffect } from "react";
import { View, Text, Button } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import MapViewDirections from "react-native-maps-directions";
import { GOOGLE_MAPS_API_KEY } from "@env";
import axios from "axios";

const App = () => {
  const [location, setLocation] = useState(null);
  const [destinations, setDestinations] = useState([]);
  const [isSelectingDestinations, setIsSelectingDestinations] = useState(false);
  const [rutaOptima, setRutaOptima] = useState([]);

  useEffect(() => {
    // Obtener la ubicación actual del dispositivo
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.error("Permiso de ubicación no concedido");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  const obtenerRutaDesdeAPI = async (solicitud) => {
    try {
      const respuesta = await axios.post(
        "https://routes.googleapis.com/directions/v2:computeRoutes",
        {
          ...solicitud,
          key: GOOGLE_MAPS_API_KEY,
        }
      );

      return respuesta.data;
    } catch (error) {
      console.error("Error al obtener la ruta:", error);
      throw error;
    }
  };

  const finishSelectingDestinations = async () => {
    setIsSelectingDestinations(false);

    // Calcular la ruta óptima utilizando la API de Routes
    if (destinations.length > 1) {
      try {
        const solicitudRuta = {
          origin: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
          destination: {
            latitude: destinations[destinations.length - 1].latitude,
            longitude: destinations[destinations.length - 1].longitude,
          },
          intermediates: destinations.slice(1, -1).map((dest) => ({
            latitude: dest.latitude,
            longitude: dest.longitude,
          })),
          travelMode: "DRIVE", // Puedes ajustar el modo de viaje según tus necesidades
          units: "metric",
          optimizeWaypointOrder: true, // Puedes ajustar según sea necesario
          key: GOOGLE_MAPS_API_KEY,
        };

        const data = await obtenerRutaDesdeAPI(solicitudRuta);

        if (data.routes && data.routes.length > 0) {
          // Aquí puedes trabajar con la primera ruta, que es la más recomendada
          const rutaRecomendada = data.routes[0];
          console.log("Ruta recomendada:", rutaRecomendada);

          // También puedes acceder a las rutas alternativas si están disponibles
          const rutasAlternativas = data.routes.slice(1);
          console.log("Rutas alternativas:", rutasAlternativas);

          // Actualizar el estado con la ruta óptima
          setRutaOptima(rutaRecomendada.overview_path);
        } else {
          console.warn("No se encontraron rutas.");
        }
      } catch (error) {
        console.error("Error al calcular la ruta óptima:", error);
      }
    }
  };

  const handleMapPress = (event) => {
    if (isSelectingDestinations && event.nativeEvent) {
      event.persist();

      setDestinations((prevDestinations) => [
        ...prevDestinations,
        {
          latitude: event.nativeEvent.coordinate.latitude,
          longitude: event.nativeEvent.coordinate.longitude,
        },
      ]);
    }
  };

  const startSelectingDestinations = () => {
    setDestinations([]); // Limpiar destinos anteriores
    setIsSelectingDestinations(true);
  };

  return (
    <View style={{ flex: 1 }}>
      {location ? (
        <MapView
          style={{ flex: 1 }}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          onPress={handleMapPress}
        >
          {/* Marcador para la ubicación actual */}
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="Mi Ubicación"
            description="Estoy aquí"
          />

          {/* Marcadores de destinos */}
          {destinations.map((dest, index) => (
            <Marker
              key={index}
              coordinate={dest}
              title={`Destino ${index + 1}`}
              description={`Lat: ${dest.latitude}, Long: ${dest.longitude}`}
              pinColor="blue"
            />
          ))}

          {/* Direcciones de la ruta */}
          {/* Direcciones de la ruta */}
          {rutaOptima.length > 1 && !isSelectingDestinations && (
            <MapView.Polyline
              coordinates={rutaOptima}
              strokeWidth={3}
              strokeColor="hotpink"
            />
          )}
        </MapView>
      ) : (
        <View>
          <Text>Obteniendo la ubicación...</Text>
        </View>
      )}

      {isSelectingDestinations ? (
        <Button
          title="Terminar de Elegir Destinos"
          onPress={finishSelectingDestinations}
        />
      ) : (
        <>
          <Button
            title="Elegir Destinos"
            onPress={startSelectingDestinations}
          />
          {rutaOptima.length > 0 && (
            <View>
              <Text>Ruta Óptima:</Text>
              {rutaOptima.map((destino, index) => (
                <Text key={index}>{`Destino ${index + 1}: Lat ${
                  destino.latitude
                }, Long ${destino.longitude}`}</Text>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
};

export default App;
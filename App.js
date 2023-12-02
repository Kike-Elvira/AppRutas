import React, { useState, useEffect } from "react";
import { Alert, View, Text, TextInput, Button } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import MapViewDirections from "react-native-maps-directions";
import { GOOGLE_MAPS_API_KEY } from "@env";
import calcularRutaOptima from "./calcularRutaOptima";

const App = () => {
  const [location, setLocation] = useState(null);
  const [destinations, setDestinations] = useState([]);
  const [isSelectingDestinations, setIsSelectingDestinations] = useState(false);
  const [rutaOptima, setRutaOptima] = useState([]);
  const [rutaSeleccionada, setRutaSeleccionada] = useState(null);
  const [mostrarRutaOptima, setMostrarRutaOptima] = useState(false);
  const [nombreDestinoTemp, setNombreDestinoTemp] = useState("");

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
  const handleRutaClick = (index) => {
    setRutaSeleccionada(index);
  };
  const borrarDestino = (index) => {
    const nuevosDestinos = [...destinations];
    nuevosDestinos.splice(index, 1);
    setDestinations(nuevosDestinos);

    // Recalcular la ruta óptima
    const rutaOptimaCalculada = calcularRutaOptima(
      {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      },
      nuevosDestinos
    );
    setRutaOptima(rutaOptimaCalculada);
  };

  const handleMapPress = (event) => {
    if (isSelectingDestinations && event.nativeEvent) {
      event.persist();
      // Utilizamos un estado temporal para almacenar la entrada del usuario

      Alert.prompt(
        "Nombre del Destino",
        "Introduce el nombre del destino:",
        (nombre) => {
          if (nombre) {
            setDestinations((prevDestinations) => [
              ...prevDestinations,
              {
                nombre: nombre,
                latitude: event.nativeEvent.coordinate.latitude,
                longitude: event.nativeEvent.coordinate.longitude,
              },
            ]);
          }
        }
      );
    }
  };

  const startSelectingDestinations = () => {
    setDestinations([]); // Limpiar destinos anteriores
    setIsSelectingDestinations(true);
  };

  const finishSelectingDestinations = () => {
    setIsSelectingDestinations(false);

    // Calcular la ruta óptima
    const rutaOptimaCalculada = calcularRutaOptima(
      {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      },
      destinations
    );
    setRutaOptima(rutaOptimaCalculada);
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
              title={dest.nombre}
              description={`Lat: ${dest.latitude}, Long: ${dest.longitude}`}
              pinColor="blue"
            />
          ))}

          {/* Direcciones de la ruta */}
          {rutaOptima.length > 1 && !isSelectingDestinations && (
            <>
              {rutaOptima.map((destino, index) => {
                if (index === 0) return null; // Omitir el primer punto (ubicación inicial)
                const origen = rutaOptima[index - 1];
                const color = `rgb(${Math.random() * 255},${
                  Math.random() * 255
                },${Math.random() * 255})`; // Generar un color aleatorio
                return (
                  <MapViewDirections
                    key={index}
                    origin={{
                      latitude: origen.latitude,
                      longitude: origen.longitude,
                    }}
                    destination={{
                      latitude: destino.latitude,
                      longitude: destino.longitude,
                    }}
                    apikey={GOOGLE_MAPS_API_KEY}
                    strokeWidth={rutaSeleccionada === index ? 6 : 3}
                    strokeColor={rutaSeleccionada === index ? "yellow" : color} // Cambiar el color si está seleccionado
                    onPress={() => handleRutaClick(index)} // Manejar clic en la ruta
                  />
                );
              })}
            </>
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

          <Button
            title="Ver orden de destinos"
            onPress={() => {
              setMostrarRutaOptima(!mostrarRutaOptima);
            }}
          ></Button>
          {mostrarRutaOptima && rutaOptima.length > 0 && (
            <View>
              <Text>Ruta Óptima:</Text>
              {rutaOptima.map((destino, index) => (
                <View key={index}>
                  <Text>{`${destino.nombre} Destino numero:${index + 1}`}</Text>
                  <Button title="Borrar" onPress={() => borrarDestino(index)} />
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
};

export default App;

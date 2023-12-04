import React, { useState, useEffect, useRef } from "react";
import { Alert, View, Text, TextInput, Button } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import MapViewDirections from "react-native-maps-directions";
import { GOOGLE_MAPS_API_KEY } from "@env";
import calcularRutaOptima from "./calcularRutaOptima";
import { getDistance } from "geolib";
import { StyleSheet } from "react-native";
import { ActionSheetIOS } from "react-native";

const App = () => {
  const [location, setLocation] = useState(null);
  const [destinations, setDestinations] = useState([]);
  const [isSelectingDestinations, setIsSelectingDestinations] = useState(false);
  const [rutaOptima, setRutaOptima] = useState([]);
  const [rutaSeleccionada, setRutaSeleccionada] = useState(null);
  const [mostrarRutaOptima, setMostrarRutaOptima] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [rutaColores, setRutaColores] = useState([]);

  const mapRef = useRef(null);

  useEffect(() => {
    let isMounted = true; // Esta variable se usa para prevenir la actualización del estado en un componente desmontado

    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.error("Permiso de ubicación no concedido");
        return;
      }

      await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000, // Actualizar la ubicación cada 1 segundo
          distanceInterval: 1, // O cada 1 metro, lo que ocurra primero
        },
        (newLocation) => {
          if (isMounted) {
            setLocation(newLocation);
          }
        }
      );
    })();

    return () => {
      isMounted = false; // Prevenir la actualización del estado después de que el componente se haya desmontado
    };
  }, []);

  const handleRutaClick = (index) => {
    setRutaSeleccionada(index);
  };
  const borrarDestino = () => {
    const opciones = destinations.map((destino) => destino.nombre);
    opciones.push("Cancelar");

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: opciones,
        cancelButtonIndex: opciones.length - 1,
      },
      (buttonIndex) => {
        if (buttonIndex !== opciones.length - 1) {
          const nuevosDestinos = [...destinations];
          nuevosDestinos.splice(buttonIndex, 1);
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
        }
      }
    );
  };
  const calcularDistanciaTotal = (ruta) => {
    let distanciaTotal = 0;
    for (let i = 0; i < ruta.length - 1; i++) {
      distanciaTotal += getDistance(
        { latitude: ruta[i].latitude, longitude: ruta[i].longitude },
        { latitude: ruta[i + 1].latitude, longitude: ruta[i + 1].longitude }
      );
    }
    return distanciaTotal / 1000; // Convertir a kilómetros
  };

  const calcularTiempoHastaDestino = (ruta, indexDestino) => {
    let extra;
    if (indexDestino === 0) {
      extra = 0;
    } else {
      extra = 10 / 60; // Convertir minutos a horas
    }
    let tiempoHastaDestino = 0 + extra;
    const velocidad = 60;
    for (let i = 0; i < indexDestino; i++) {
      tiempoHastaDestino +=
        getDistance(
          { latitude: ruta[i].latitude, longitude: ruta[i].longitude },
          { latitude: ruta[i + 1].latitude, longitude: ruta[i + 1].longitude }
        ) /
        1000 /
        velocidad; // Tiempo de viaje en horas
      if (i !== indexDestino - 1) {
        tiempoHastaDestino += 10 / 60; // Agregar 10 minutos convertidos a horas
      }
    }
    return tiempoHastaDestino;
  };

  const calcularDuracionEstimada = (ruta) => {
    const velocidad = 60; // Velocidad de viaje en km/h
    const distanciaTotal = calcularDistanciaTotal(ruta);
    const tiempoTotalMinutos = (distanciaTotal / velocidad) * 60; // Tiempo de viaje en minutos
    const horas = Math.floor(tiempoTotalMinutos / 60);
    const minutos = Math.round(tiempoTotalMinutos % 60);
    return { horas, minutos };
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
    Alert.alert(
      "Elegir destinos",
      "¿Estás seguro de que quieres empezar a elegir nuevos destinos?",
      [
        {
          text: "Cancelar",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel",
        },
        {
          text: "OK",
          onPress: () => {
            setDestinations([]); // Limpiar destinos anteriores
            setIsSelectingDestinations(true);
          },
        },
      ],
      { cancelable: false }
    );
  };

  const finishSelectingDestinations = () => {
    setIsSelectingDestinations(false);
    setIsNavigating(true);

    // Calcular la ruta óptima
    const rutaOptimaCalculada = calcularRutaOptima(
      {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      },
      destinations
    );
    setRutaOptima(rutaOptimaCalculada);
    // Generar colores aleatorios para las rutas
    const colores = destinations.map(
      () =>
        `rgb(${Math.random() * 255},${Math.random() * 255},${
          Math.random() * 255
        })`
    );
    setRutaColores(colores);
  };

  return (
    <View style={{ flex: 1 }}>
      {location ? (
        <MapView
          ref={mapRef}
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
                    strokeColor={
                      rutaSeleccionada === index
                        ? "yellow"
                        : rutaColores[index - 1]
                    } // Usar el color almacenado
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

          <Button
            title="Iniciar Navegación"
            onPress={() => {
              if (mapRef.current) {
                // Asumiendo que el primer elemento de rutaOptima es el origen y el segundo es el destino más cercano
                const puntosParaEnfocar = rutaOptima
                  .slice(0, 2)
                  .map((destino) => ({
                    latitude: destino.latitude,
                    longitude: destino.longitude,
                  }));

                mapRef.current.fitToCoordinates(puntosParaEnfocar, {
                  edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                  animated: true,
                });
              }
            }}
          />
          <Button
            title="Borrar algun destino"
            onPress={() => borrarDestino()}
          />

          {mostrarRutaOptima && rutaOptima.length > 0 && (
            <View style={styles.container}>
              <View style={styles.rutaContainer}>
                <Text style={styles.text}>Ruta Óptima:</Text>
                <Text style={styles.text}>
                  Distancia total: {calcularDistanciaTotal(rutaOptima)} km
                </Text>
                <Text style={styles.text}>
                  Duración estimada:{" "}
                  {calcularDuracionEstimada(rutaOptima).horas} horas y{" "}
                  {calcularDuracionEstimada(rutaOptima).minutos +
                    10 * destinations.length}{" "}
                  minutos
                </Text>
              </View>
              {rutaOptima.map((destino, index) => {
                if (index === 0) return null; // Omitir el primer punto (ubicación inicial)
                const tiempoHastaDestino = calcularTiempoHastaDestino(
                  rutaOptima,
                  index
                );

                const eta = new Date(
                  Date.now() + tiempoHastaDestino * 60 * 60 * 1000
                );
                return (
                  <View
                    key={index}
                    style={[
                      styles.destinoContainer,
                      { backgroundColor: rutaColores[index - 1] },
                    ]}
                  >
                    <Text
                      style={styles.text}
                    >{`${destino.nombre} Destino numero:${index}`}</Text>
                    <Text style={styles.text}>
                      ETA: {eta.toLocaleTimeString()}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </>
      )}
    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    margin: 10,
  },
  destinoContainer: {
    backgroundColor: "lightblue",
    margin: 10,
    padding: 10,
    borderRadius: 5,
  },
  rutaContainer: {
    backgroundColor: "lightgreen",
    margin: 10,
    padding: 10,
    borderRadius: 5,
  },
  text: {
    color: "black",
  },
});

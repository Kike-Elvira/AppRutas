import React, { useState, useEffect } from 'react';
import { View, Text, Button } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import MapViewDirections from 'react-native-maps-directions';
import { GOOGLE_MAPS_API_KEY } from '@env';

const App = () => {
  const [location, setLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [places, setPlaces] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false); // Nuevo estado para controlar si estamos navegando

  useEffect(() => {
    // Obtener la ubicación actual del dispositivo
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permiso de ubicación no concedido');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);

      // Obtener lugares cercanos usando la Places API
      const placesResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.coords.latitude},${location.coords.longitude}&radius=500&type=restaurant&key=${GOOGLE_MAPS_API_KEY}`,
      );
      const placesData = await placesResponse.json();
      setPlaces(placesData.results);
    })();
  }, []);

  const handleMapPress = (event) => {
    if (!isNavigating) {
      // Solo permitir la selección de ubicación si no estamos en modo de navegación
      setDestination({
        latitude: event.nativeEvent.coordinate.latitude,
        longitude: event.nativeEvent.coordinate.longitude,
        name: 'Destino Personalizado',
      });
    }
  };

  const startNavigation = () => {
    // Lógica para iniciar la navegación
    setIsNavigating(true);
    console.log('Iniciando navegación...');
    // Puedes agregar más lógica aquí según tus requisitos
  };

  const stopNavigation = () => {
    // Lógica para detener la navegación
    setIsNavigating(false);
    setDestination(null); // Limpiar el destino al abandonar la navegación
    console.log('Navegación abandonada...');
    // Puedes agregar más lógica aquí según tus requisitos
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

          {/* Marcador de destino personalizado */}
          {destination && (
            <Marker
              coordinate={{
                latitude: destination.latitude,
                longitude: destination.longitude,
              }}
              title={destination.name}
              description="Destino Personalizado"
              pinColor="blue"
            />
          )}

          {/* Direcciones de la ruta */}
          {destination && (
            <MapViewDirections
              origin={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              destination={{
                latitude: destination.latitude,
                longitude: destination.longitude,
              }}
              apikey={GOOGLE_MAPS_API_KEY}
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

      {/* Botón para obtener la ruta */}
      {destination && !isNavigating && (
        <Button
          title={`Obtener ruta a ${destination.name}`}
          onPress={() => {
            // Aquí puedes agregar lógica adicional antes de obtener la ruta
            // Por ejemplo, puedes mostrar un mensaje o iniciar la navegación.
            console.log(`Obteniendo ruta a ${destination.name}`);
          }}
        />
      )}

      {/* Botón para iniciar la navegación */}
      {destination && !isNavigating && (
        <Button
          title="Iniciar Navegación"
          onPress={startNavigation}
        />
      )}

      {/* Botón para abandonar la navegación */}
      {isNavigating && (
        <Button
          title="Abandonar Navegación"
          onPress={stopNavigation}
        />
      )}
    </View>
  );
};

export default App;


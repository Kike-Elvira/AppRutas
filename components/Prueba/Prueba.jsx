import React, { useState } from 'react';
import { View, TextInput, Button } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { GOOGLE_MAPS_API_KEY } from '@env';
const App = () => {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');

  // Cargar las variables de entorno



  const handleCalculateRoute = () => {
    // Implementa la lógica para calcular la ruta aquí.
  };

  return (
    <View style={{ flex: 1 }}>
      <TextInput
        placeholder="Ubicación de origen"
        value={origin}
        onChangeText={setOrigin}
      />
      <TextInput
        placeholder="Ubicación de destino"
        value={destination}
        onChangeText={setDestination}
      />
      <Button title="Calcular Ruta" onPress={handleCalculateRoute} />

      {/* Mapa */}
      <MapView
        style={{ flex: 1 }}
        region={{
          latitude: 37.7749,
          longitude: -122.4194,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {/* Marcador de origen */}
        {origin !== '' && <Marker coordinate={{ /* Coordenadas de origen */ }} />}

        {/* Marcador de destino */}
        {destination !== '' && <Marker coordinate={{ /* Coordenadas de destino */ }} />}

        {/* Direcciones de la ruta */}
        {origin !== '' && destination !== '' && (
          <MapViewDirections
            origin={{ /* Coordenadas de origen */ }}
            destination={{ /* Coordenadas de destino */ }}
            apikey={GOOGLE_MAPS_API_KEY}
            strokeWidth={3}
            strokeColor="hotpink"
          />
        )}
      </MapView>
    </View>
  );
};

export default App;

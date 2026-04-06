const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Interceptar las resoluciones para forzar las versiones CommonJS de librerías conflictivas en la web.
// Esto EVITA POR COMPLETO el error de "import.meta" al saltearnos los archivos .mjs
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // 1. Forzar Zustand a CommonJS
  if (moduleName === 'zustand' || moduleName.startsWith('zustand/')) {
    let resolvedPath;
    if (moduleName === 'zustand') {
        resolvedPath = path.resolve(__dirname, 'node_modules/zustand/index.js');
    } else {
        const subPath = moduleName.replace('zustand/', '');
        resolvedPath = path.resolve(__dirname, `node_modules/zustand/${subPath}.js`);
    }
    return { filePath: resolvedPath, type: 'sourceFile' };
  }

  // 2. Forzar Socket.io a CommonJS solo en web
  if (platform === 'web') {
    if (moduleName === 'socket.io-client') {
      return {
        filePath: path.resolve(__dirname, 'node_modules/socket.io-client/build/cjs/index.js'),
        type: 'sourceFile',
      };
    }
    if (moduleName === 'engine.io-client') {
      return {
        filePath: path.resolve(__dirname, 'node_modules/engine.io-client/build/cjs/index.js'),
        type: 'sourceFile',
      };
    }
  }

  // Flujo normal para el resto de módulos
  return context.resolveRequest(context, moduleName, platform);
};

// Eliminar .mjs completamente de los resolver extensions para forzar 100% el uso de CommonJS en toda la app web.
config.resolver.sourceExts = config.resolver.sourceExts.filter((ext) => ext !== 'mjs');

module.exports = config;

import moduleAlias from 'module-alias'
import path from 'path'

moduleAlias.addAliases({
  '@adapters': path.resolve(__dirname, 'adapters'),
  '@Agent': path.resolve(__dirname, 'Agent'),
  '@fs': path.resolve(__dirname, 'fs'),
  '@HTTPServer': path.resolve(__dirname, 'HTTPServer'),
  '@ports': path.resolve(__dirname, 'ports'),
})

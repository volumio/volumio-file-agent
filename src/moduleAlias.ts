import moduleAlias from 'module-alias'
import path from 'path'

moduleAlias.addAliases({
  '@adapters': path.resolve(__dirname, 'adapters'),
  '@Agent': path.resolve(__dirname, 'Agent'),
  '@HTTPServer': path.resolve(__dirname, 'HTTPServer'),
  '@ports': path.resolve(__dirname, 'ports'),
})

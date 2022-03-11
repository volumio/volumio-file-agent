import moduleAlias from 'module-alias'
import path from 'path'

moduleAlias.addAliases({
  '@Agent': path.resolve(__dirname, 'Agent'),
  '@HTTPServer': path.resolve(__dirname, 'HTTPServer'),
})

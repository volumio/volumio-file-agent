/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-empty-function */
import './endpoints/add-mount-point'
import './endpoints/get-all-mount-points'
import './endpoints/health-check'

import { api } from '@airtasker/spot'

@api({ name: 'Device File Agent HTTP Interface' })
export class Api {}

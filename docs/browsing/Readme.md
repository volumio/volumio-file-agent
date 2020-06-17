# Endpoints

- `GET /contents?folder={path}`:
  ```typescript
  type Response = {
    subfolders: string[]
    tracks: (Track & {
      artist: Artist
      album: Album
    })[]
  }
  ```
- `GET /artists`:
  ```typescript
  type Response = Artist[]
  ```
- `GET /artists/{name}`
  ```typescript
  type Response = Artist & {
    albums: Album[]
    tracks: Track[] // Tracks should be sorted by album, track no
  }
  ```
- `GET /albums`:
  ```typescript
  type Response = (Album & {
    artist: Artist
    albumArtist: Artist
  })[]
  ```
- `GET /album?artistName={name}&title={name}`:
  ```typescript
  type Response = Album & {
    artist: Artist
    albumArtist: Artist
    tracks: Track[]
  }
  ```
- `GET /genres`:
  ```typescript
  type Response = Genre[]
  ```
- `GET /genres/{name}`:
  ```typescript
  type Response = Genre & {
    artists: Artist[]
    albums: Album[]
  }
  ```
- `GET /composers`:
  ```typescript
  type Response = Composer[]
  ```
- `GET /composers/{name}`:
  ```typescript
  type Response = Composer & {
    albums: Album[]
    tracks: Track[] // Tracks should be sorted by album, track no
  }
  ```
- `GET /years`:
  ```typescript
  type Response = number[]
  ```
- `GET /years/{number}`:
  ```typescript
  type Response = {
    albums: Album[]
  }
  ```
- `GET /search?term={string}&type={"any" | "album" | "artist"}`:
  ```typescript
  type Response = {
    albums: Album[]
  }
  ```

# Entities

```typescript
type Artist {
    name: string
}

type Album {
    bitdepth: number[]
    bitrate: number[]
    fileTypes: string[]
    genre: string
    musicbrainzIDs: string[]
    samplerate: number[]
    title: string
    trackPathWithEmbeddedAlbumart?: string
    year: number
}

type Track {
    bitdepth?: number
    bitrate?: number
    fileType: string
    hasEmbeddedAlbumart: boolean
    musicbrainz: {
        ID?: string
        albumID?: string
        artistID? string
        albumartistID?: string
    }
    path: string
    samplerate?: number
    title: string
}

type Genre {
    name: string
}

type Composer {
    name
}
```

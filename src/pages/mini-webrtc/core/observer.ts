type EventFn = (...args: any[]) => void


// export class Observable<Events extends { [key: string]: EventFn } = {}> {
export class Observable<Events extends Record<string, EventFn> = {}> {
  #observers: Map<string, Set<EventFn>>

  constructor() {
    this.#observers = new Map()
  }

  /**
   * @template {keyof EVENTS & string} NAME
   * @param {NAME} name
   * @param {EVENTS[NAME]} f
   */
  on<Key extends keyof Events & string>(name: Key, f: Events[Key]) {
    const set = this.#observers.get(name) || new Set()
    set.add(f)
    this.#observers.set(name, set)

    return f
  }


  once<Key extends keyof Events & string>(name: Key, f: Events[Key]) {
    const _f = ((...args: unknown[]) => {
      this.off(name, _f)
      f(...args)
    }) as Events[Key]

    this.on(name, _f)
  }


  off<Key extends keyof Events & string>(name: Key, f: Events[Key]) {
    const observers = this.#observers.get(name)

    if (!observers) return

    observers.delete(f)


    if (observers.size === 0)
      this.#observers.delete(name)
  }

  emit<Key extends keyof Events & string>(name: Key, ...args: Parameters<Events[Key]>) {

    const set = this.#observers.get(name)

    if (!set) return

    set.forEach(f => {
      f(...args)
    })
  }

  destroy() {
    this.#observers = new Map()
  }
}

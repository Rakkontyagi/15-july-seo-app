
import { EventEmitter } from 'events';

export class LeakPrevention extends EventEmitter {
  private maxListeners = 10;

  constructor() {
    super();
    this.setMaxListeners(this.maxListeners);
  }

  addManagedListener(emitter: EventEmitter, eventName: string, listener: (...args: any[]) => void) {
    emitter.on(eventName, listener);
    this.on('cleanup', () => {
      emitter.removeListener(eventName, listener);
    });
  }

  cleanup() {
    this.emit('cleanup');
  }
}

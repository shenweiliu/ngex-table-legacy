import { Injectable } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { map, filter } from 'rxjs/operators'; 

interface Message {
    type: string;
    payload: any;
}

type MessageCallback = (payload: any) => void;

@Injectable()
export class MessageTransferService {
    private handler = new Subject<Message>();

    broadcast(type: string, payload: any) {
        this.handler.next({ type, payload });
    }

    subscribe(type: string, callback: MessageCallback): Subscription {
        return this.handler.pipe(
            filter(message => message.type === type),
            map(message => message.payload)
        ).subscribe(callback);
    }
}

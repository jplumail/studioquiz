import { RoomId } from '@/shared/types';
import Game from './game';


export default async function Page({
    params,
  }: {
    params: Promise<{ room: string }>
  }) {
    const room = (await params).room;
    return <Game room={room as RoomId}/>;
}
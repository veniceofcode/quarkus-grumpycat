package org.wanja.fatcat;

import java.util.Date;
import java.util.List;

import javax.transaction.Transactional;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;

import org.wanja.fatcat.model.MultiPlayer;
import org.wanja.fatcat.model.MultiPlayerGame;
import org.wanja.fatcat.model.Player;

import io.quarkus.logging.Log;

@Path("/mp-game")
public class MultiPlayerResource {

    public static class MultiPlayerPlayerGame {
        public MultiPlayerGame game;
        public MultiPlayer host;

        MultiPlayerPlayerGame() {

        }
    }


    /**
     * Creates a new MP game. 
     * @param game a structure which contains a prefilled game and the player who acts as host
     * @return creates the game in db and returns all structures
     */
    @POST
    @Path("/new")
    @Transactional
    public MultiPlayerGame createGame(MultiPlayerPlayerGame gamestr) {
        MultiPlayerGame game = gamestr.game;
        MultiPlayer     host = gamestr.host;
        game.player1 = host;
        game.isClosed = false;
        game.isRunning = false;
        game.isOpen = true;
        game.timeStarted = new Date();
        game.persist();
        Log.info("New Multiplayer game created with id: " + game.id);
        return game;
    }

    @PUT  
    @Path("/join/{gameId}")
    @Transactional
    public void joinGame(Long gameId, MultiPlayer player ) {
        MultiPlayerGame game = MultiPlayerGame.findById(gameId);
        if( game != null ) {
            if( game.player2 != null ) game.player2 = player;
            else if( game.player3 != null ) game.player3 = player;
            else if( game.player4 != null ) game.player4 = player;
            else throw new IllegalStateException("Game " + game.id + " is allready full");
            game.persist();
        }
    }
     
    @POST
    @Path("/player")
    @Transactional
    public MultiPlayer createMultiPlayerFromPlayer(Player p) {
        MultiPlayer mp = new MultiPlayer(p);
        mp.persist();
        Log.info("New Multiplayer Player created with id " + mp.id);
        return mp;
    }

    @GET
    @Path("/open")
    public List<MultiPlayerGame> listOpenGames() {
        return MultiPlayerGame.list("isClosed=false and isRunning=false and isOpen=true order by timeStarted desc");
    }

    @GET
    @Path("/open/{playerId}")
    public List<MultiPlayerGame> myOpenGame(Long playerId) {
        return MultiPlayerGame.find("isOpen = true and isClosed=false AND (player1Id = ?1 or player2Id = ?1 or player3Id = ?1 or player4Id = ?1)", playerId).list();
    }

}

/*
 * Copyright 1996 by Michel D. Grimminck
 *
 * All Rights Reserved
 *
 * Permission to use, copy, modify, and distribute this software and its
 * documentation for any purpose and without fee is hereby granted,
 * provided that the above copyright notice appear in all copies and that
 * both that copyright notice and this permission notice appear in
 * supporting documentation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 */

#include <stdio.h>
#include "var.h"
#include "functions.h"
#include <string.h>
#include <time.h>
#include <math.h>
#include <signal.h>

static int deepning[32]={20, 33, 53, 67, 77, 86, 94, 100, 106, 111, 115, 119, 123, 127, 130, 133, 136, 139, 142, 144, 146, 149, 151, 153, 155, 157, 158, 160, 162, 164, 165, 167}; /* near-logarithmic function */
int stopflag=false;
int max_ext_depth;
int current_move[MAXPLY];

#define USEHASH 200

void stopsearch(int sig)
{
    sig++;
    set_col(31,31);
    printf("Search terminated\n");
    res_col();
    stopflag=true;
}

void analysePosition(float maxtime)
{
    int d;
    int m,oppex;
    float time1;
    int nmoves,score;
    int depth;
    int stop;
    int d1,d2;
    int bestscore;
    int bestScorePreviousDepth;
    int moveSc[MAXNM];
    int moveDepth[MAXNM];
    int exactSc[MAXNM];
    int dtwScore;
    int exact;
    
    d=400;
    
    time1=clock();
    init_hash();
    set_eval();
    init_tstats();
    
    stop=false;
    stopflag=false;
    
    winprint("\n");
    winprint("STARTANALYSEPOS\n");
    winprint("THINK|1\n");
    
    nmoves=move_list(0,game_color);
    
    for(m=0;m<nmoves;m++) {
        moveSc[m]=0;
        exactSc[m]=false;
    }
    
    while((clock()-time1)/CLOCKS_PER_SEC<maxtime && stop==false && d<100*(MAXPLY-20)) {
        nmoves=move_list(0,game_color);
        bestScorePreviousDepth=bestscore;
        bestscore=-INF;
        for(m=0;m<nmoves;m++) {
            if (moveSc[m]<(WIN-1000) && moveSc[m]>(LOSE+1000) && exactSc[m]==false) {
                d2=d;
                if (d>500) { /* reduce search depth for bad moves */
                    if (moveSc[m]<bestScorePreviousDepth-500) {
                        d2=d-100;
                    }
                    if (moveSc[m]<bestScorePreviousDepth-1500) {
                        d2=d-200;
                    }
                    if (moveSc[m]<bestScorePreviousDepth-3500) {
                        d2=d-300;
                    }
                }
                //printf("%i %i %i %i\n",moveSc[m],bestScorePreviousDepth,d,d2);
                do_move(movelist[0][m]);

                exact=false;
                dtwScore=-theoreticDTW(1-game_color);
                
                if (dtwScore==-UNKNOWN) {
                    for (d1=d-800;d1<=d2;d1+=200) {
                        score=-alfabeta(-INF,INF,1-game_color,1,d1,0,&oppex);
                    }
                } else {
                    score=dtwScore;
                    exact=true;
                }
                undo_move(movelist[0][m]);
                exactSc[m]=exact;
                moveSc[m]=score;
                moveDepth[m]=d2;
                if (score>bestscore) { bestscore=score; }
                if (stopflag==true) {
                    winprint("THINK|0\n");
                    return;
                }
                winprint("ANALYSE_RESULT|");
                print_move(movelist[0][m]);
                winprint("|%i|%.3f|%i|",d2/100+1,score/1000.0F,exact);
                print_move(PV[1][1]);
                winprint("\n");
                if ((clock()-time1)/CLOCKS_PER_SEC>maxtime) { stop=true; break; }
            }
        }
        d+=100;
    }
    winprint("THINK|0\n");
    
}

void countGame(int depth)
{
    int i,col,score;
    int oppex;
    
    init_tstats();
    for (i=0;i<game_history_max;i++) {
        col=game_color^((i-game_history_nr)&1);
        init_stats();
        init_hash();
        decompress_board(board,game_history[i].board);
        set_pieces();
        if (move_list(0,col)>1) {
            score=alfabeta(-INF,INF,col,0,100*(depth-2),0,&oppex);
            score=alfabeta(-INF,INF,col,0,100*depth,0,&oppex);
            dprint("%llu\n",tneval);
        }
    }
}


void analyseGame(int anaWhite,int anaBlack,float maxtime,int threshold,int batchmode)
/* batchmode 0 or 1 */
{
    BTYPE local[93];
    int m,oppex;
    int i,j;
    int d,d2;
    copy_board(local,board);
    stopflag=false;
    int baseScore;
    int myScore;
    int userScore;
    int col;
    float time;
    char buffer[MAXCOMMENT];
    int maxp;
    float timePerMove=0.1;
    int ncomment;
    char myPV[MPV][MOVEL];
    float totTime;
    
    winprint("\n");
    winprint("STARTANALYSEGAME\n");
    winprint("THINK|1\n");

    init_tstats();
    useBlockingPlay=true;
    
    totTime=clock();
    d=0;
    for (i=0;i<game_history_max;i++) {
        strcpy(game_history[i].tmp,game_history[i].comment);
    }
    while((clock()-totTime)/CLOCKS_PER_SEC<maxtime && stopflag==false && d<100*(MAXPLY-20)) {
        ncomment=0;
        for (i=0;i<game_history_max;i++) {
            if ((float)(clock()-totTime)/CLOCKS_PER_SEC>maxtime) break;
            col=game_color^((i-game_history_nr)&1);
            if (((col==white && anaWhite==1) || (col==black && anaBlack==1))) {
                decompress_board(board,game_history[i].board);
                set_pieces();
                if (move_list(0,col)>1) {
                    init_stats();
                    init_hash();
                    baseScore=alfabeta(-INF,INF,col,0,200,0,&oppex);
                    
                    d=400;
                    time=clock();
                    while((clock()-time)<0.5*CLOCKS_PER_SEC*timePerMove && d<(100*(MAXPLY-20))) {
                        init_stats();
                        d2=d;
                        myScore=alfabeta(-INF,INF,col,0,d,0,&oppex);
                        d+=100;
                    }
                    // copy pv
                    for(j=0;j<MPV;j++) movecopy(myPV[j],PV[0][j]);
                    
                    do_move(game_history[i].move);
                    init_stats();
                    init_hash();
                    userScore=-alfabeta(-INF,INF,1-col,0,d2-100,0,&oppex);
                    undo_move(game_history[i].move);
                    /*init_stats();
                    init_hash();
                    myScore=alfabeta(-INF,INF,col,0,d,0,&oppex);*/
                    if (stopflag==true) break;
                    if (myScore>userScore+threshold && threshold>100) { /* confirm result at increased depth */
                        d2=d2+400;
                        myScore=alfabeta(-INF,INF,col,0,d2,0,&oppex);
                        // copy pv
                        for(j=0;j<MPV;j++) movecopy(myPV[j],PV[0][j]);

                        do_move(game_history[i].move);
                        init_stats();
                        init_hash();
                        userScore=-alfabeta(-INF,INF,1-col,0,d2-100,0,&oppex);
                        undo_move(game_history[i].move);
                    }
                    if (stopflag==true) break;
                    strcpy(game_history[i].comment,game_history[i].tmp); /* prevent lower-ply analyse to write garbage into the comments */
                    //
                    dprint("ANALYSE_GAME|%i|%i|%i|%.3f|%.3f|%.3f|%.1f|%i|%s - %s|",i,game_history_max,d2/100,baseScore/1000.0F,myScore/1000.0F,userScore/1000.0F,timePerMove,ncomment,pdn_info.whitepl,pdn_info.blackpl);
                    if (myScore>userScore+threshold) {
                        /* player made a mistake or player missed a good move */
                        ncomment++;
                        if (myScore>userScore+500) strcat(game_history[i].comment,"?");
                        strcat(game_history[i].comment,"? ");
                        maxp=MPV;
                        if (d/100<maxp) maxp=d/100;
                        for(j=0;j<maxp;j++) if (myPV[j][0]!=0) {
                            sprint_move(buffer,myPV[j]);
                            strcat(game_history[i].comment,buffer);
                            if (myScore>baseScore+threshold && j==0) strcat(game_history[i].comment,"!!");
                            strcat(game_history[i].comment," ");
                            /*if (quiet((col+j)%2==true && evalboard((col+j)%2,-INF,INF) break;*/
                        }
                        if( myScore!=WIN) {
                            sprintf(buffer," (beter by +%.3f at %i ply)",(myScore-userScore)/1000.0F,d2/100);
                        } else {
                            sprintf(buffer," (forced win at %i ply)",d2/100);
                        }
                        strcat(game_history[i].comment,buffer);
                        winShowHistory();
                    }
                    print_move(game_history[i].move);
                    dprint("\n");
                    printf(": %i  %.3f  %.3f  %.3f\n",i,baseScore/1000.0F,myScore/1000.0F,userScore/1000.0F);        
                }
            }
        }   
        timePerMove=4*timePerMove;
    }     
    if (batchmode==1 && stopflag==false) {
        write_pdn("com/save.tmp");
    }
    winprint("THINK|0\n");
    
    copy_board(board,local);
    set_pieces();
    useBlockingPlay=false;
}
int play(int color, float maxtime, int maxdepth, int verbose)
/* front end for alpha-beta
   search for player 'color' until maxtime is reached.
   if maxtime=0 search forever.
   */
{
    int n,time1,d,score,t,myscore,myd,i,exact;
    int my_score,my_d,my_time,my_neval,totalman;
    char mymove[32];
    char comment[MAXCOMMENT];
    int plyscore[MAXPLY];
    int accept=true;
    int offer=true;
    int resign=true;
    int ntest=0;
    float t1;
    float tstart,tend;
    float timeFactor;
    float timeForPreviousIteration;
    float depthForPreviousIteration;
    float nextTime;
    float branchFactor;
    int dtmp;
    int allExact;
    int best;
    int nr;
    
    lastSearchDepth=0;
    tstart=clock();
    winprint("\n");
    winprint("CLEARPV\n");
    winprint("THINK|1\n");
    set_eval();
    stopflag=false;
    n=move_list(0,color);
    if (n==0) {
        winprint("\n");
        winprint("ILOSE\n");
        return(-INF);
    }
    if (n==1) {
        if (verbose>0) {
            printf("forced move:");
            print_move(movelist[0][0]);
            printf("\n");
            winprint("\n");
            winprint("THINK|0\n");
         }
        win_print_move(movelist[0][0]);
        xstore_history(movelist[0][0],"");
        winShowHistory();
        do_move(movelist[0][0]);

        if (move_list(MAXPLY-1,game_color)==0) {
            winprint("\n");
            winprint("DRAGONWINS|%i\n",game_color);
                if (game_color==white) {
                    strcpy(pdn_info.result,"0-1");
                }
                if (game_color==black) {
                    strcpy(pdn_info.result,"1-0");
                }
            winShowHistory();
        }

        
        return(false);
    }
    score=try_book(0,color);
    if (score!=UNKNOWN) {
        if (verbose>0) {printf("book move:"); print_move(PV[0][0]); printf("\n");}
        winprint("\n");
        winprint("THINK|0\n");
        return(score);
    }

    /* look in the dtw database tables */    
    allExact=true;
    best=-INF;
    
    for(nr=0;nr<n;nr++) {
        do_move(movelist[0][nr]);
        score=theoreticDTW(color^1);
        if (score==UNKNOWN) {
            allExact=false;
        } else {
            if ((-score)>best) {
                best=-score;
                movecopy(mymove,movelist[0][nr]);
            }
        }
        undo_move(movelist[0][nr]);
    }
    if (allExact==true && best!=0 && best>LOSE && best<WIN) {
        winprint("\n");
        winprint("PV|%i|%.3f|%.1f|",1,best/1000.0F,0.0F);
        print_move(mymove);
        dprint("|dtw databases");
        xstore_history(mymove,"exact");  // changes gamecolor
        winShowHistory();
        do_move(mymove);
        win_print_move(mymove);
        winprint("%i\n",best);
        return(best);
    }
        
    score=theoretic(color);
    /*if (score!=UNKNOWN) {
        printf("exact move, score:%i\n",score);
        plyscore[0]=score=theo_alfabeta(-INF,INF,color,0,d,theoretic(color));
        movecopy(mymove,PV[0][0]);
        xstore_history(mymove,"exact");
        winShowHistory();
        do_move(mymove);
        set_col(32,32);
        printf("my move: ");
        print_move(mymove);
        win_print_move(mymove);
        printf("\n");
        res_col();
        return(score);
    }*/
notexact:
    d=100;
    signal(SIGINT,stopsearch);
    time1=clock();
    init_hash();
    init_tstats();
    t=-clock();
    
    timeFactor=1.35;    
    
    timeForPreviousIteration=0;
    depthForPreviousIteration=0;
    while((/*((clock()-time1)<timeFactor*CLOCKS_PER_SEC*maxtime || maxtime==0) &&*/ d<=maxdepth && d<100*(MAXPLY-10)) || d==100 ) {
        init_stats();
        max_ext_depth=(d/100)+4;
        t1=clock();
        /*plyscore[d/100]=score=alfabeta(-INF,INF,color,0,d,0,&exact);*/
        if (eval_type==3) {
            plyscore[d/100]=score=probalfabeta(-INF,INF,color,0,d,0,&exact);
        } else {
            plyscore[d/100]=score=alfabeta(-INF,INF,color,0,d,0,&exact);
        }
        lastSearchDepth=d;
        if (verbose>=0) printf(" (%i) ",exact);
        if (stopflag==false) {
            movecopy(mymove,PV[0][0]);
            my_score=score;
            my_d=d;
            my_neval=neval;
        }
        else {
            if (verbose>0) {
                set_col(32,32);
                printf("my move: ");
                print_move(mymove);
                win_print_move(mymove);
                printf("\n");
                res_col();
            }
            break;
        }
        t1=(clock()-t1)/CLOCKS_PER_SEC;
        if (verbose>3) {
            set_col(33,33);
            if ((verbose>5 && ((double) t/CLOCKS_PER_SEC)>1.0) || verbose>9) printf("\n");
            printf("depth:%2i   ",d/100);
            printf("s:%.3f t:%.1f   ",score/1000.0F,(float) t1);
            if (windows==false) {
                print_pv();
            }
            res_col();
            if ((windows==false || verbose>5 && ((double) t/CLOCKS_PER_SEC)>3.0) || verbose>9) {
                print_stats();
                if ( ((double) t/CLOCKS_PER_SEC)>60.0) beep();
            }
            fflush(stdout);
        }
        if (windows==true && verbose>5) {
            winprint("\n");
            winprint("PV|%i|%.3f|%.1f|",d/100,score/1000.0F,(float) t1);
            print_pv();
            winprint("|");
            print_stats();
            winprint("\n");
        }
        if (score==WIN || score==LOSE) break;
        dtmp=d;
        if (timeForPreviousIteration>0) {
            float timeTilNow=((float)clock()-time1)/CLOCKS_PER_SEC;
                
            branchFactor=t1/timeForPreviousIteration;
            if (branchFactor<1.0) branchFactor=1.0;
            if (branchFactor>6.0) branchFactor=6.0;
            if (d-depthForPreviousIteration>100) branchFactor=sqrt(branchFactor);
            
            nextTime=t1*branchFactor+timeTilNow;
            //printf("curtime: %.2f nexttime: %.2f factor:%.2f  %f\n",timeTilNow,nextTime,branchFactor,t1);
            if (nextTime>timeFactor*maxtime && d!=100 ) break;

            nextTime=t1*branchFactor*branchFactor+timeTilNow;
            //printf("curtim2: %.2f nexttime: %.2f factor:%.2f  %f\n",timeTilNow,nextTime,branchFactor,t1);
            if (allowTwoPlyIncrements==true && nextTime<0.8*maxtime && branchFactor<3.0F) d+=100;
        }
        d+=100;
            
        /*if (eval_type==1 && (clock()-time1)<0.3*CLOCKS_PER_SEC*maxtime) d+=100;*/

        timeForPreviousIteration=t1;
        depthForPreviousIteration=dtmp;

    }
    t+=clock();
        
    signal(SIGINT,SIG_DFL);
    stopflag=false;
    sprintf(comment,"[%%eval %.3f][%%egt 0:0:%.2f][%%depth %i][%%nodes %i]",(float)(my_score/1000.0F),(float) t/CLOCKS_PER_SEC,my_d/100,my_neval);
    if (mymove[0]==0) { /* no move was selected; they all lose */
        movecopy(mymove,movelist[0][0]);
    }
    xstore_history(mymove,comment);  // changes gamecolor
    winShowHistory();
    do_move(mymove);
    win_print_move(mymove);

    if (move_list(MAXPLY-1,game_color)==0) {
        winprint("\n");
        winprint("DRAGONWINS|%i\n",game_color);
    }
    
    for(i=2;i<d/100;i++) {
        if (plyscore[i]>-5500) resign=false;
        if (plyscore[i]>-10) accept=false;
        if (plyscore[i]!=0) offer=false;
        ntest++;
    }
#ifndef QT
    beep();
#endif
    totalman=pieces[white|man]+pieces[black|man]+pieces[white|crown]+pieces[black|crown];
    if (ntest>=3) {
        if (resign==true) {
            printf("I resign\n");
            winprint("\n");
            winprint("RESIGN\n");
        }
        else if (accept==true && totalman<=14) printf("accepting draws (if offered)\n");
        else if (offer==true && totalman<=14) printf("offering draw\n");
    }
    winprint("\n");
    winprint("THINK|0\n");
    tend=clock();
    timeUsed[color]+=(tend-tstart)/CLOCKS_PER_SEC+operator_time;

    return(score);
}

void resume(void)
{
    ;
}

void print_pv(void)
{
    int i;

    printf("pv: ");
    for(i=0;i<MPV;i++) if (PV[0][i][0]!=0) {
            print_move(PV[0][i]);
            dprint(" ");
        }
    printf("\n");
    resume();
}

int move_nr(char *move)
{
    if (move[0]!=4) return(invmap[move[1]]);
    else if (move[1]==(move[3]+6) || move[1]==(move[3]-6)) return(invmap[move[1]]+50);
    else return(invmap[move[1]]+100);
}

void badmove(int level,char *move,int nmoves)
{
    int mnr,lm;

    mnr=move_nr(move);
    if (level>2) {
        lm=move_nr(movelist[level-1][current_move[level-1]]);
        countermove[level&1][lm][mnr]=(970*countermove[level&1][lm][mnr])/1024;
    }
    if (kill_method==PROBKILL) history[level][mnr][nmoves]=(00+970*history[level][mnr][nmoves])/1024;
}

void goodmove(int level,char *move,int nmoves)
{
    int mnr,lm;

    mnr=move_nr(move);
    if (level>2) {
        lm=move_nr(movelist[level-1][current_move[level-1]]);
        countermove[level&1][lm][mnr]=1024-(970*(1024-countermove[level&1][lm][mnr]))/1024;
    }
    if (kill_method==HISTORY) history[level][mnr][0]++;
    else if (kill_method==PROBKILL) history[level][mnr][nmoves]=1024-(970*(1024-history[level] [mnr] [nmoves]))/1024;
    movecopy(killer[level],move);

}

void goodmove2(int level,char *move,int nmoves)
{
    int mnr;

    mnr=move_nr(move);
    if (kill_method==HISTORY) history[level] [mnr] [0]++;
    else if (kill_method==PROBKILL) history[level][mnr][nmoves]+=124;
    movecopy(killer[level],move);
}


void storemove(int level,char *move)
{
    int i;

    if (level>=maxpv) return;

    movecopy(PV[level][level],move);
    for(i=level+1;i<maxpv;i++) {
        movecopy(PV[level][i],PV[level+1][i]);
    }
}

void store_rephash(int color)
{
    int entry;
    unsigned int key;

    key=hash_key(color);
    entry=key%REPHASH;
    if (rephash[entry].hashkey==-1) {
        rephash[entry].hashkey=key;
        strong_compress_board(rephash[entry].board,board);
        rephash[entry].board[17]=color;
    }
}

int is_repetition(int color)
{
    int i,entry;
    unsigned int key;
    unsigned char temp[18];

    key=hash_key(color);
    entry=key%REPHASH;

    if (key!=rephash[entry].hashkey) return(false);
    strong_compress_board(temp,board); temp[17]=color;
    for(i=0;i<18;i++) if (rephash[entry].board[i]!=temp[i]) return(false);
    return(true);
}

void init_rephash(void)
{
    int i;
    BTYPE temp[93];

    copy_board(temp,board);
    /* fill up hashtables for detection of repetition (=draw) */
    for(i=0;i<REPHASH;i++) {
        rephash[i].hashkey=-1;
        rephash[i].board[0]=invalid;
    }
    for(i=0;i<game_history_nr;i++) {
        decompress_board(board,game_history[i].board);
        store_rephash(i%2);
    }
    copy_board(board,temp);
}


void init_hash(void)
{
    int i;

    for(i=0;i<tablesize;i++) {
        transpos[i].hashkey=-1;
        transpos[i].board[0]=invalid;
        transpos[i].depth=0;
    }
    for(i=0;i<MAXEVAL;i++) {
        evalcache[i].hashkey=-1;
        evalcache[i].board[0]=invalid;
    }
    init_rephash();
}

unsigned int hash_key(int color)
{
    unsigned int key=0;
    int i;

    for(i=0;i<50;i++) key+=hash_rnd[i][board[map[i]]];
    key=key&0xFFFFFFFE;
    return(key+2*color);
}

int retreive_eval(int color)
/* retreive the current position from the hash table */
{
    int i,entry;
    unsigned int key;
    unsigned char temp[18];

    key=hash_key(color);
    entry=key%MAXEVAL;

    if (key!=evalcache[entry].hashkey) {
        return(UNKNOWN);
    }
    strong_compress_board(temp,board); temp[17]=color;
    for(i=0;i<18;i++) if (evalcache[entry].board[i]!=temp[i]) return(UNKNOWN);
    outeval++;
    return(evalcache[entry].score);
}

void store_eval(int color,int score)
/* store the current position in the hash table */
{
    int entry;
    unsigned int key;

    key=hash_key(color);
    entry=key%MAXEVAL;

    evalcache[entry].hashkey=key;
    evalcache[entry].score=score;
    strong_compress_board(evalcache[entry].board,board);
    evalcache[entry].board[17]=color;
    ineval++;
}

int retreive_hash(int color,int *min, int *max,int *hd,char *move)
/* retreive the current position from the hash table */
{
    int i,entry;
    unsigned int key;
    unsigned char temp[18];

    key=hash_key(color);
    entry=key%tablesize;

    if (key!=transpos[entry].hashkey) {
        entry++;
        if (key!=transpos[entry].hashkey) return(UNKNOWN);
    }
    strong_compress_board(temp,board); temp[17]=color;
    for(i=0;i<18;i++) if (transpos[entry].board[i]!=temp[i]) return(UNKNOWN);
    outhash++;
    *min=transpos[entry].min_score;
    *max=transpos[entry].max_score;
    *hd=transpos[entry].depth;
    move[0]=transpos[entry].move[0];
    move[1]=transpos[entry].move[1];
    return(!UNKNOWN);
}

void store_hash(int color,int depth,int min,int max,char *move)
/* store the current position in the hash table */
{
    int entry;
    unsigned int key;

    key=hash_key(color);
    entry=key%tablesize;

    if (transpos[entry].depth>depth) {
        transpos[entry+1]=transpos[entry];
    }
    transpos[entry].hashkey=key;
    transpos[entry].min_score=min;
    transpos[entry].max_score=max;
    strong_compress_board(transpos[entry].board,board);
    transpos[entry].board[17]=color;
    transpos[entry].depth=depth;
    transpos[entry].move[0]=move[1];
    transpos[entry].move[1]=move[move[0]-1];
    inhash++;
}

void sort_viahash(int level,int nmoves,char *hashmove,int depth,int color)
{
    int i;
    char temp[32];

    /*if (depth>=600) {
        do_presearch(level,nmoves,color);
    }*/
    for(i=0;i<nmoves;i++) if (movelist[level][i][1]==hashmove[0] && movelist[level][i][(int)movelist[level][i][0]-1]==hashmove[1]) {
            movecopy(temp,movelist[level][0]);
            movecopy(movelist[level][0],movelist[level][i]);
            movecopy(movelist[level][i],temp);
            return;
        }

    set_col(31,31);
    printf("error: movelist corrupted\n"); res_col();
    display_board();
    print_movelist(level,nmoves);
    print_move(hashmove);
}

void findkiller(int level,int nmoves)
{
    int i;
    char temp[32];

    for(i=0;i<nmoves;i++) if (movecmp(movelist[level][i],killer[level])==0) {
            movecopy(temp,movelist[level][0]);
            movecopy(movelist[level][0],movelist[level][i]);
            movecopy(movelist[level][i],temp);
            break;
        }
}

int quiet_crown(int p,int color)
{
    int d,pp,eneman,enecrown;

    eneman=man|!color;enecrown=crown|!color;

    for(d=0;d<4;d++) {
        pp=p;
        do pp=next[color][pp][d]; while(board[pp]==empty);
        if (board[pp]==eneman || board[pp]==enecrown) if (board[next[color][pp][d]]==empty) return(false);
    }
    return(true);
}

int wnc_quiet()
{
    int ip,p;

    for(ip=5;ip<50;ip++) {
        p=map[ip];
        if (board[p] == (white|man)) {
            if (board[p-7]==(black|man)) if (board[p-14]==empty) return(false);
            if (board[p-6]==(black|man)) if (board[p-12]==empty) return(false);
            if (board[p+7]==(black|man)) if (board[p+14]==empty) return(false);
            if (board[p+6]==(black|man)) if (board[p+12]==empty) return(false);
        }
    }
    nquietfail++;
    return(true);
}

int w_quiet()
{
    int ip,p,d,pp;

    if (pieces[white|crown]==0 && pieces[black|crown]==0) return(wnc_quiet());
    for(ip=0;ip!=50;ip++) {
        p=map[ip];
        if (board[p] == (white|man)) {
            if (board[p-7]==(black|man) || board[p-7]==(black|crown)) if (board[p-14]==empty) return(false);
            if (board[p-6]==(black|man) || board[p-6]==(black|crown)) if (board[p-12]==empty) return(false);
            if (board[p+7]==(black|man) || board[p+7]==(black|crown)) if (board[p+14]==empty) return(false);
            if (board[p+6]==(black|man) || board[p+6]==(black|crown)) if (board[p+12]==empty) return(false);
        }
        else if (board[p] ==(white|crown)) {
            for(d=0;d<4;d++) {
                pp=p;
                do pp=next[white][pp][d]; while(board[pp]==empty);
                if (board[pp]==(black|man) || board[pp]==(black|crown)) if (board[next[white][pp][d]]==empty) return(false);
            }
        }
    }
    nquietfail++;
    return(true);
}

int bnc_quiet()
{
    int ip,p;

    for(ip=44;ip>=0;ip--) {
        p=map[ip];
        if (board[p] == (black|man)) {
            if (board[p+7]==(white|man)) if (board[p+14]==empty) return(false);
            if (board[p+6]==(white|man)) if (board[p+12]==empty) return(false);
            if (board[p-7]==(white|man)) if (board[p-14]==empty) return(false);
            if (board[p-6]==(white|man)) if (board[p-12]==empty) return(false);
        }
    }
    nquietfail++;
    return(true);
}


int b_quiet()
{
    int ip,p,d,pp;

    if (pieces[white|crown]==0 && pieces[black|crown]==0) return(bnc_quiet());
    for(ip=49;ip>=0;ip--) {
        p=map[ip];
        if (board[p] == (black|man)) {
            if (board[p+7]==(white|man) || board[p+7]==(white|crown)) if (board[p+14]==empty) return(false);
            if (board[p+6]==(white|man) || board[p+6]==(white|crown)) if (board[p+12]==empty) return(false);
            if (board[p-7]==(white|man) || board[p-7]==(white|crown)) if (board[p-14]==empty) return(false);
            if (board[p-6]==(white|man) || board[p-6]==(white|crown)) if (board[p-12]==empty) return(false);
        }
        else if (board[p] ==(black|crown)) {
            for(d=0;d<4;d++) {
                pp=p;
                do pp=next[black][pp][d]; while(board[pp]==empty);
                if (board[pp]==(white|man) || board[pp]==(white|crown)) if (board[next[black][pp][d]]==empty) return(false);
            }
        }
    }
    nquietfail++;
    return(true);
}

int quiet(int color)
/* returns false if color can capture, true otherwise */
{
    nquiet++;
    if (color==white) return(w_quiet());
    else return(b_quiet());
    printf("fatal: q\n");
    return(false);
}

int active(int target,int color,int cdepth,int depth)
/* if non-active move available/(non-forced): return true if target is met
   else try achieve target with active moves only
   */
{
    int i,nr,score,activemoves=0,nmoves;
    int at_nr,def_nr,has_defence,try_active,defmoves;

    score=theoretic(color);
    if (score!=UNKNOWN) {
        if (score>=target) return(true);
        else return(false);
    }

    /* create general movelist */
    nmoves=move_list(cdepth,color);
    if (nmoves==0) return(false);

    try_active=true;
    if (movelist[cdepth][0][0]!=4) try_active=false; /* forced move */
    if (nmoves==1) try_active=false;

    if (movelist[cdepth][0][0]==4 && nmoves!=1) { /* no forced move:
                   try doing nothing and achieving target */
        score=material(color);
        deval[cdepth]++;
        if (score>=target) return(true);
    }

    if (depth<=0) { /* no move moves are allowed, target not achieved */
        return(false);
    }
    /* make list of active moves */
    if (try_active==true) {
        for(i=0;i<nmoves;i++) {
            do_move(movelist[cdepth][i]);
            if (quiet(color^1)==false) {
                movecopy(movelist[cdepth][activemoves],movelist[cdepth][i]);
                activemoves++;
            }
            undo_move(movelist[cdepth][i]);
        }
        nmoves=activemoves;
    }
    if (cdepth==0) printf("%i active moves\n",nmoves);
    /* we now have nmoves active or forced moves to do,
       do them all to achieve a true value, or return false
       otherwise
     */
    for(at_nr=0;at_nr<nmoves;at_nr++) {
        do_move(movelist[cdepth][at_nr]); /* do your active move */
        defmoves=move_list(cdepth+1,color^1);
        has_defence=false; /* defender loses */
        /* try all defences (they are forced) */
        for(def_nr=0;def_nr<defmoves;def_nr++) {
            do_move(movelist[cdepth+1][def_nr]);
            if (active(target,color,cdepth+2,depth-200)==false) {   /* attacker has no win */
                has_defence=true;
                /* break: undo move */
                undo_move(movelist[cdepth+1][def_nr]);
                break;
            }
            undo_move(movelist[cdepth+1][def_nr]);
        }
        if (cdepth==0) {
            movecopy(movescore[at_nr].move,movelist[cdepth][at_nr]);
            movescore[nr].value=has_defence;
        }
        if (has_defence==false) { /* target achieved!, undo move and return */
            goodmove(cdepth,movelist[cdepth][at_nr],nmoves);
            storemove(cdepth,movelist[cdepth][at_nr]);
            undo_move(movelist[cdepth][at_nr]);
            return(true);
        }
        undo_move(movelist[cdepth][at_nr]);
    }
    /* otherwise, for all active moves, target is not achieved */
    return(false);
}

int quiet_search(int alfa,int beta,int color,int cdepth)
/* quiescence search looks for material only.
*/
{
    int nmoves,nr,score;

    nmoves=move_list(cdepth,color);

    for(nr=0;nr<nmoves;nr++) {
        do_move(movelist[cdepth][nr]);
        if (quiet(color^1)==true) score=-material(color^1);
        else score=-quiet_search(-beta,-alfa,color^1,cdepth+1);

        if (score>=beta) {
            undo_move(movelist[cdepth][nr]);
            return(score);
        }
        if (score>alfa) alfa=score;
        undo_move(movelist[cdepth][nr]);
    }
    return(alfa);
}

void sort_moves_slow(int cdepth,int nmoves,int *iterscore)
{
    /* optimise iterscore[move] */
    int i,j,t;
    char tempmove[32];

    for(i=0;i<nmoves-1;i++) for(j=i+1;j<nmoves;j++)
            if (iterscore[i]<iterscore[j]) {
                movecopy(tempmove,movelist[cdepth][i]);
                movecopy(movelist[cdepth][i],movelist[cdepth][j]);
                movecopy(movelist[cdepth][j],tempmove);
                t=iterscore[i]; iterscore[i]=iterscore[j]; iterscore[j]=t;
            }
}

void sort_moves(int cdepth,int nmoves,int *iterscore)
{
    /* optimise iterscore[move] */
    int i,j,a;
    char tempmove[32];

    for(j=1;j<nmoves;j++) {
        a=iterscore[j];
        movecopy(tempmove,movelist[cdepth][j]);
        i=j-1;
        while(i>=0 && iterscore[i]<a) {
            iterscore[i+1]=iterscore[i];
            movecopy(movelist[cdepth][i+1],movelist[cdepth][i]);
            i--;
        }
        iterscore[i+1]=a;
        movecopy(movelist[cdepth][i+1],tempmove);
    }
}

int do_presearch(int cdepth,int nmoves,int color,int depth)
{
    int nr,sortlow=-INF;
    int iterscore[MAXNM];
    int ud,dummy;
    int prec;
    int e;
    
    ud=100;
    if (depth>=600) ud=200;
    if (depth>=800) ud=300;
    precount-=neval;
    for(nr=0; nr<nmoves; nr++) {
        do_move(movelist[cdepth][nr]);
        if (quiet(color^1)==false) {
            iterscore[nr]=300-alfabeta(-INF,INF,color ^1,cdepth+1,ud,50,&dummy)/*+500-120*move_list(cdepth+1,color^1);*/;
        } else {
            e=retreive_eval(color^1);
            if (e==UNKNOWN) {
                e=evalboard(color^1,-INF,INF,&prec);
                if (prec==true) {
                    store_eval(color,e);
                }
                iterscore[nr]=-e-10*move_list(cdepth+1,color^1);
            }
        }

        undo_move(movelist[cdepth][nr]);
    }

    /* sort moves highest score first */
    sort_moves(cdepth,nmoves,iterscore);
    precount+=neval;
    return(0);
}

int giterscore[MAXNM];
char dummymove[32];

int solve(int alfa,int beta,int color,int cdepth,int depth)
{
    int treesize[MAXNM],iterscore[MAXNM],predepth[MAXNM];
    int i,nr,myscore=!UNKNOWN,score,result,nmoves,ts;


    if (depth<=0) { neval++; deval[cdepth]++; return(theoretic(color)); }

    score=theoretic(color);
    if (score!=UNKNOWN) return(score);

    nmoves=move_list(cdepth,color);
    if (nmoves==0) return(LOSE);

    for(i=0;i<nmoves;i++) {
        predepth[i]=-100; treesize[i]=0; iterscore[i]=UNKNOWN;
    }

    do {
        for(nr=0;nr<nmoves;nr++) if (iterscore[nr]==UNKNOWN) {
                do_move(movelist[cdepth][nr]);
                treesize[nr]=-neval; predepth[nr]+=100;

                result=solve(-beta,-alfa,color ^1,cdepth+1,predepth[nr]);
                treesize[nr]+=neval;
                undo_move(movelist[cdepth][nr]);
                /*if (cdepth==0) {
                    print_move(movelist[cdepth][nr]);
                    if (result==UNKNOWN) printf("    unknown\n");
                    else if ((-result)==WIN) printf("    win\n");
                    else if ((-result)==LOSE) printf("    lose\n");
                    else if ((-result)==0) printf("    draw\n");
                }*/
                if (result!=UNKNOWN) {
                    score=iterscore[nr]=-result;
                    if (score>=beta || score==WIN && cdepth!=0) return(score);
                    if (score>alfa) alfa=score;
                } else myscore=iterscore[nr]=UNKNOWN;

            }
        if (cdepth==0) for(nr=0;nr<nmoves;nr++) {
                print_move(movelist[cdepth][nr]);
                printf("  %i %i %i ",treesize[nr],iterscore[nr],predepth[nr]);
                if (iterscore[nr]==UNKNOWN) printf("    unknown\n");
                else if (iterscore[nr]==WIN) printf("    win\n");
                else if (iterscore[nr]==LOSE) printf("    lose\n");
                else if (iterscore[nr]==0) printf("    draw\n");
            }
        for(nr=0;nr<nmoves;nr++) if (predepth[nr]>=(depth-100)) goto esc;

        for(nr=0;nr<nmoves;nr++) if (iterscore[nr]==UNKNOWN) continue;

    } while(1==1);
esc:
    if (myscore==UNKNOWN) return(UNKNOWN);
    return(alfa);
}

int theo_alfabeta(int alfa,int beta,int color,int cdepth,int depth,int exact)
{
    int best=-INF,nmoves,nr,tscore;

    nmoves=move_list(cdepth,color);
    if (nmoves==0) return(LOSE);

    for(nr=0;nr<nmoves;nr++) {
        do_move(movelist[cdepth][nr]);
        tscore=theoretic(color^1);
        if (cdepth==0) {
            movescore[nr].value=-tscore;
            movecopy(movescore[nr].move,movelist[cdepth][nr]);
        }
        if (tscore!=UNKNOWN) {
            if ((-tscore)>best) {
                best=-tscore;
                storemove(cdepth,movelist[cdepth][nr]);
            }
        }
        undo_move(movelist[cdepth][nr]);
    }
    if (best==-INF) return(UNKNOWN);
    return(best);
}

int doSearchExtend(int color)
/* returns true if leaf-node should be extended because of tactical considerations
   
   call only in quiet positions
*/
{
    int i1,i2,i3,i4,i5,i6;
    int ip,p;
    static BTYPE temp[93];
    BTYPE *local;  /* out local board */

    /* makesure we work on a white to move board */
    if (color==white) {
        local=board;
    }
    else {
        local=temp;
        reverse_board(local,board);
    }
    
    for(ip=0;ip<50;ip++) {
        p=map[ip];
        if (local[p]==(white|man)) {
            /*        
                  ..
                ww  bb
                      ww
                        ww
            */          
            if (local[p-7]==(black|man) && (local[p+7]==(white|man) || local[p+7]==invalid) &&
               local[p-14]==empty && LWBOARD(p,-3,1)==(white|man)
            ) {
                i1=mapTo4[LWBOARD(p,-4,0)];
                i2=mapTo4[LWBOARD(p,-3,1)];
                i3=mapTo4[LWBOARD(p,0,4)];
                i4=mapTo4[LWBOARD(p,-1,3)];
                i5=mapTo4[LWBOARD(p,-4,4)];
                i6=mapTo4[LWBOARD(p,-3,3)];
                if (takeback[i1][i2][i3][i4][i5][i6]==0) {
                    //printf("1\n");
                    pat_succes++;
                    return true;
                }
            }
           /* mirror */
            if (local[p-6]==(black|man) && (local[p+6]==(white|man) || local[p+6]==invalid) &&
               local[p-12]==empty && LWBOARD(p,3,1)==(white|man)
            ) {
                i1=mapTo4[LWBOARD(p,4,0)];
                i2=mapTo4[LWBOARD(p,3,1)];
                i3=mapTo4[LWBOARD(p,0,4)];
                i4=mapTo4[LWBOARD(p,1,3)];
                i5=mapTo4[LWBOARD(p,4,4)];
                i6=mapTo4[LWBOARD(p,3,3)];
                if (takeback[i1][i2][i3][i4][i5][i6]==0) {
                    //printf("2\n");
                    pat_succes++;
                    return true;
                }
            }
           
            /*    ..  ..
                    ..
                  bb
                ww  ..
                      ww
            */
            if (local[p-6]==(black|man) && local[p-12]==empty && local[p+1]==empty && LWBOARD(p,3,-1)==(color|man) && LWBOARD(p,1,3)==empty && LWBOARD(p,3,3)==empty) {
                i1=mapTo4[LWBOARD(p,0,4)];
                i2=mapTo4[LWBOARD(p,1,3)];
                i3=mapTo4[LWBOARD(p,4,0)];
                i4=mapTo4[LWBOARD(p,3,1)];
                i5=mapTo4[LWBOARD(p,4,4)];
                i6=mapTo4[LWBOARD(p,3,3)];
                if (takeback[i1][i2][i3][i4][i5][i6]==0) {
                    i1=mapTo4[LWBOARD(p,-1,-1)];
                    i2=mapTo4[LWBOARD(p,0,0)];
                    i3=mapTo4[LWBOARD(p,3,3)];
                    i4=mapTo4[LWBOARD(p,2,2)];
                    i5=mapTo4[LWBOARD(p,-1,3)];
                    i6=mapTo4[LWBOARD(p,0,2)];
                    if (takeback[i1][i2][i3][i4][i5][i6]==0) {
                        //printf("3\n");
                        pat_succes++;
                        return true;
                    }
                }
            }
            if (local[p-7]==(black|man) && local[p-14]==empty && local[p-1]==empty && LWBOARD(p,-3,-1)==(color|man) && LWBOARD(p,-1,3)==empty && LWBOARD(p,-3,3)==empty) {
                i1=mapTo4[LWBOARD(p,-4,0)];
                i2=mapTo4[LWBOARD(p,-3,1)];
                i3=mapTo4[LWBOARD(p,0,4)];
                i4=mapTo4[LWBOARD(p,-1,3)];
                i5=mapTo4[LWBOARD(p,-4,4)];
                i6=mapTo4[LWBOARD(p,-3,3)];
                if (takeback[i1][i2][i3][i4][i5][i6]==0) {
                    i1=mapTo4[LWBOARD(p,-3,-3)];
                    i2=mapTo4[LWBOARD(p,-2,2)];
                    i3=mapTo4[LWBOARD(p,1,-1)];
                    i4=mapTo4[LWBOARD(p,0,0)];
                    i5=mapTo4[LWBOARD(p,1,3)];
                    i6=mapTo4[LWBOARD(p,0,2)];
                    if (takeback[i1][i2][i3][i4][i5][i6]==0) {
                        //printf("4\n");
                        pat_succes++;
                        return true;
                    }
                }
            }
            /*
                    ..
                      bb
                        ww
                          bb
                            ..
            */
            if (local[p-6]==(black|man) && local[p-12]==empty && local[p+6]==(black|man) && local[p+12]==empty) {
                i1=mapTo4[LWBOARD(p,0,4)];
                i2=mapTo4[LWBOARD(p,1,3)];
                i3=mapTo4[LWBOARD(p,4,0)];
                i4=mapTo4[LWBOARD(p,3,1)];
                i5=mapTo4[LWBOARD(p,4,4)];
                i6=mapTo4[LWBOARD(p,3,3)];
                if (takeback[i1][i2][i3][i4][i5][i6]==0) {
                    i1=mapTo4[LWBOARD(p,0,-4)];
                    i2=mapTo4[LWBOARD(p,-1,-3)];
                    i3=mapTo4[LWBOARD(p,-4,0)];
                    i4=mapTo4[LWBOARD(p,-3,-1)];
                    i5=mapTo4[LWBOARD(p,-4,-4)];
                    i6=mapTo4[LWBOARD(p,-3,-3)];
                    if (takeback[i1][i2][i3][i4][i5][i6]==0) {
                        //printf("5\n");
                        pat_succes++;
                        return true;
                    }
                }
            }
            if (local[p-7]==(black|man) && local[p-14]==empty && local[p+7]==(black|man) && local[p+14]==empty) {
                i1=mapTo4[LWBOARD(p,0,4)];
                i2=mapTo4[LWBOARD(p,-1,3)];
                i3=mapTo4[LWBOARD(p,-4,0)];
                i4=mapTo4[LWBOARD(p,-3,1)];
                i5=mapTo4[LWBOARD(p,-4,4)];
                i6=mapTo4[LWBOARD(p,-3,3)];
                if (takeback[i1][i2][i3][i4][i5][i6]==0) {
                    i1=mapTo4[LWBOARD(p,0,-4)];
                    i2=mapTo4[LWBOARD(p,1,-3)];
                    i3=mapTo4[LWBOARD(p,4,0)];
                    i4=mapTo4[LWBOARD(p,3,-1)];
                    i5=mapTo4[LWBOARD(p,4,-4)];
                    i6=mapTo4[LWBOARD(p,3,-3)];
                    if (takeback[i1][i2][i3][i4][i5][i6]==0) {
                        //printf("6:%i %i\n",ip+1,p);
                        pat_succes++;
                        return  true;
                    }
                }
            }
        }
    }
    return false;
}
int moveselect[MAXPLY];

int probalfabeta(int alfa,int beta,int color,int cdepth,int depth,int flags,int *exact)
{
    int score,best=-1,q,min,max,hd;
    int nmoves,nr,atleastdraw=false,atmostdraw=true,oppex;
    int nextdepth;
    int pat,mateval,newflags,alfa0=alfa;
    char hashmove[2];
    int iterscore[MAXNM];
    int prob[MAXNM];  // probability for next move
    int totProb=0,dstep;
    int stop;
    int dummy,maxMoveScore=-INF,nGood,nBad;
    int prec;
    
    *exact=NOTEXACT;
    /* depth <0: return static evaluation */
   
    if (depth<=0) {
        /*detectPatterns();*/
        if (eval_type!=99) {
            pat=npat_find(color,cdepth);
            if (pat==true) {
                pat_found++;
                dprint("dasfdf\n");
                min=evalboard(color,-INF,INF,&prec);
                deval[cdepth]++;
                do_move(movelist[cdepth][0]);
                score=-alfabeta(-INF,INF,color ^1,cdepth+1,20,flags,&oppex);
                undo_move(movelist[cdepth][0]);
                
                
                if (score>min+500) {
                    pat_succes++;
                } else {
                }
                return(min>score?min:score);                        
            }
        }
        deval[cdepth]++;
        score=theoretic(color);
        if (score==0) *exact=EXACTDRAW;
        return(evalboard(color,alfa,beta,&prec));
    }
    hashmove[0]=0;

    if (use_hash && depth>USEHASH) {
        score=retreive_hash(color,&min,&max,&hd,hashmove);
        if (score!=UNKNOWN && hd>=depth) {
            if (min==max) return(min);
            if (min>=beta) return(min);
            if (max<=alfa) return(alfa);
            if (min>alfa) alfa=min;
        }
        if (score!=UNKNOWN && min==WIN) return(WIN);
        if (score!=UNKNOWN && max==LOSE) return(LOSE);
    }

    /* try to determen theoretic value */
    score=theoretic(color);
    if (score!=UNKNOWN) {
        int dbNr;
        if (inDatabases==true) {
            int wsm,bsm;
            wsm=findWS(pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown]);
            bsm=findBS(pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown]);

            dbNr=database_nr(color,pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown],wsm,bsm);
            if (cdepth!=0 && (inDatabases==false || (ignoreDB1!=dbNr && ignoreDB2!=dbNr))) {
                if (score==0) *exact=EXACTDRAW;
                return(score);
            }
        } else {  // normal situation: root position not in databases
            if (score==0) *exact=EXACTDRAW;
            return(score);
        }
    }

    /* generate moves */
    nmoves=move_list(cdepth,color);
    if (nmoves==0) return(LOSE);

    /* check for beta cut from hash tables */
    if (nmoves==1) goto nosort;
    
    if (use_hash && depth>=200) {
        if (stopflag==true) return(alfa);
        for(nr=0; nr<nmoves; nr++) {
            do_move(movelist[cdepth][nr]);
            score=retreive_hash(color^1,&min,&max,&hd,dummymove);
            if (score!=UNKNOWN) if (hd>=(depth-100)) {
                    score=-max;
                    if (score>=beta) {
                        storemove(cdepth,movelist[cdepth][nr]);
                        undo_move(movelist[cdepth][nr]);
                        return(score);
                    }
                    if (score>alfa) alfa=score;
                }
            undo_move(movelist[cdepth][nr]);
        }
    }
    
    /* move ordering */
    if (hashmove[0]!=0) sort_viahash(cdepth,nmoves,hashmove,depth,color);
    else if (depth>=800) {
        do_presearch(cdepth,nmoves,color,depth);
    }
    else {
        if (kill_method==KILLER) findkiller(cdepth,nmoves);
        else if (kill_method==PROBKILL) {
            int lm,mnr;
            lm=move_nr(movelist[cdepth-1][current_move[cdepth-1]]);
            for(nr=0;nr<nmoves;nr++) {
                mnr=move_nr(movelist[cdepth][nr]);
                giterscore[nr]=2*history[cdepth][mnr][nmoves];
                giterscore[nr]+=countermove[cdepth&1][lm][mnr];
            }
            sort_moves(cdepth,nmoves,giterscore);
        }
        else if (kill_method==HISTORY) {
            for(nr=0;nr<nmoves;nr++) giterscore[nr]=history[cdepth]
                                                        [ move_nr(movelist[cdepth][nr]) ] [0];
            sort_moves(cdepth,nmoves,giterscore);
        }
    }
nosort:
    if (depth>200 && cdepth==0) {
        for(nr=0;nr<nmoves;nr++) {
            do_move(movelist[cdepth][nr]);
            score=-alfabeta(-INF,INF,color ^1,cdepth+1,5,flags,&dummy);
            iterscore[nr]=score;
            if (score>maxMoveScore) maxMoveScore=score;
            undo_move(movelist[cdepth][nr]);
        }
        nGood=0;
        for (nr=0;nr<nmoves;nr++) {
            if (iterscore[nr]>(maxMoveScore-500)) {
                nGood++;
                prob[nr]=100;
            } else {
                prob[nr]=150;
            }
        }
        nBad=nmoves-nGood;
        //printf("good: %i bad:%i\n",nGood,nBad);
    } else {
        nGood=nmoves;
        nBad=0;
        for (nr=0;nr<nmoves;nr++) prob[nr]=100;
    }
    
    for (nr=0;nr<nmoves;nr++) totProb+=prob[nr];
    
    /* start normal alfa-beta search */
    for(nr=0;nr<nmoves;nr++) {
        newflags=flags;
        do_move(movelist[cdepth][nr]);
        if (cdepth<8) current_move[cdepth]=nr;
    
        dstep=100*log((double)prob[nr]/totProb)/log(2.5);
        //if (cdepth==0) printf("- %i - %i %i %i %i %i\n",cdepth,nr,iterscore[nr],prob[nr],dstep,totProb);
        nextdepth=depth+dstep;
        nextdepth=depth-prob[nr];
        if (nextdepth<=0) { /* last move ? : check quiescence */
            q=quiet(color^1);
            //if (eval_type==0 && q==true) {
                /*if (doSearchExtend(color)==true) {
                    if (cdepth>40) {display_board();
                        printf("cc1 %i\n",color);
                    }
                    q=false;
                    nextdepth=1;
                    dbfail++;
                }*/
            //}          
            if (q==false) {
                nextdepth+=99;
                while(nextdepth<0) nextdepth+=100;
            } 
            /*if (quiet(color)==false) {
                nextdepth+=99;
                while(nextdepth<0) nextdepth+=100;
            }*/
        }
        else if ((flags&EXTEND_TAKE)<=MAXEXTEND && nmoves<=2 && depth<=600) {
            nextdepth=depth;
            newflags++;
        }
        if (cdepth<4) {
            if (windows==true) {
                if (depth>500) {
                    if (cdepth==0) {
                        winprint("\n");
                        winprint("PROGRESS|%i|%i|%i|%llu|*\n",depth,nr+1,nmoves,tneval);
                    }
                }
            }
        }
        score=-probalfabeta(-beta,-alfa,color ^1,cdepth+1,nextdepth,newflags,&oppex);
        
abdone:
        /* store score for each move (at root only) */
        if (cdepth==0) {
            movecopy(movescore[nr].move,movelist[cdepth][nr]);
            movescore[nr].value=score;
            
            /*printf("%i/%i\r  ",nr,nmoves); fflush(stdout);*/
        }
        if (oppex==EXACTDRAW || oppex==ATMOSTDRAW) atleastdraw=true;
        if (!(oppex==EXACTDRAW || oppex==ATLEASTDRAW)) if (score!=LOSE) atmostdraw=false;
        /*if (cdepth==0) printf("-->%i %i\n",atleastdraw,atmostdraw);*/
        /* beta cut */
        if (score>=beta) {
            storemove(cdepth,movelist[cdepth][nr]);
            goodmove(cdepth,movelist[cdepth][nr],nmoves);
            undo_move(movelist[cdepth][nr]);
            if (use_hash && depth>USEHASH) store_hash(color,depth,score,INF,movelist[cdepth][nr]);
            if (atleastdraw==true || score==WIN) *exact=ATLEASTDRAW;
            else *exact=NOTEXACT;
            if (nr==nmoves-1) {
                if (atleastdraw==true && atmostdraw==true) *exact=EXACTDRAW;
                else if (atleastdraw==true) *exact=ATLEASTDRAW;
                else if (atmostdraw==true) *exact=ATMOSTDRAW;
                else *exact=NOTEXACT;
                /*if (*exact==EXACTDRAW) {printf("%i.",pieces[white|man]+pieces[white|crown]+pieces[black|man]+pieces[black|crown]); if (pieces[white|man]+pieces[white|crown]+pieces[black|man]+pieces[black|crown]>=8) {printf("\n%i\n",color);display_board();}}*/
            }
            return(score);
        } else badmove(cdepth,movelist[cdepth][nr],nmoves);
        undo_move(movelist[cdepth][nr]);
        if (score>alfa) {
            alfa=score;
            best=nr;
            storemove(cdepth,movelist[cdepth][nr]);
        }
    }
    if (best!=-1) {
        goodmove2(cdepth,movelist[cdepth][best],nmoves);
    }
    if (use_hash && depth>USEHASH && alfa>alfa0) store_hash(color,depth,alfa,alfa,movelist[cdepth][best]);
    if (atleastdraw==true && atmostdraw==true) *exact=EXACTDRAW;
    else if (atleastdraw==true) *exact=ATLEASTDRAW;
    else if (atmostdraw==true) *exact=ATMOSTDRAW;
    else *exact=NOTEXACT;
    return(alfa);
}

int alfabeta(int alfa,int beta,int color,int cdepth,int depth,int flags,int *exact)
{
    int score,best=-1,q,min,max,hd;
    int nmoves,nr,atleastdraw=false,atmostdraw=true,oppex;
    int nextdepth;
    int pat,mateval,newflags,alfa0=alfa;
    char hashmove[2];
    int stop;
    int precise;
    int preciseBefPat;
    
    *exact=NOTEXACT;

    /* try to determen theoretic value */
    score=theoretic(color);
    if (score!=UNKNOWN) {
        int dbNr;
        if (inDatabases==true) {
            int wsm,bsm;
            wsm=findWS(pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown]);
            bsm=findBS(pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown]);

            dbNr=database_nr(color,pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown],wsm,bsm);
            if (cdepth!=0 && (inDatabases==false || (ignoreDB1!=dbNr && ignoreDB2!=dbNr))) {
                if (score==0) *exact=EXACTDRAW;
                return(score);
            }
        } else {  // normal situation: root position not in databases
            if (score==0) *exact=EXACTDRAW;
            return(score);
        }
    }

    /* depth <0: return static evaluation */
    if (depth<=0) {
        /*detectPatterns();*/
        //if (color==white) tryGlobalHash(color);
        min=retreive_eval(color);
        if (min!=UNKNOWN) return (min);

        deval[cdepth]++;
        min=evalboard(color,alfa,beta,&preciseBefPat);
        if (min>beta+1500) return (min);
        
        pat=npat_find(color,cdepth);
        if (pat==true) {
            pat_found++;
            //min=evalboard(color,alfa-1000,beta+1000,&precise);
            deval[cdepth]++;
            do_move(movelist[cdepth][0]);
            score=-alfabeta(-INF,INF,color ^1,cdepth+1,20,flags,&oppex);
            undo_move(movelist[cdepth][0]);
            //dprint("%i %i %i\n",cdepth,min,score);
            
            if (score>min+500) {
                pat_succes++;
                /*display_board();
                print_move(movelist[cdepth][0]);
                printf("  %i %i\n",min,score);*/
                
            } else {
                /*display_board();
                print_move(movelist[cdepth][0]);
                printf("  %i %i\n",min,score);*/
            }
            if (precise==true) store_eval(color,min>score?min:score);
            return(min>score?min:score);                        
        }
        else {
            /*if (color==white && rand()%20001==0 && pieces[white|man]+pieces[black|man]>6) {
                if (evalboard(color,-INF,INF)>-700 && evalboard(color,-INF,INF)<700) {
                    char buffer[1024];
                    sprintf(buffer,"testl/%i.dcp",cntPos);
                    save_board(color,buffer);
                    cntPos++;
                }
            }*/
            /*if (color==white && rand()%201==0 && pieces[white|man]+pieces[black|man]<11) {
                if (evalboard(color,-INF,INF,&precise)>-700 && evalboard(color,-INF,INF,&precise)<700) {
                    new_table_entry(MISC,color,AB,evalboard(color,-INF,INF,&precise),0,10);
                    printf("cnt: %i",cntPos);
                    cntPos++;
                }
            }*/
        }

        if (preciseBefPat==true) store_eval(color,min);
        return(min);
    }
    hashmove[0]=0;

    if (use_hash && depth>USEHASH) {
        score=retreive_hash(color,&min,&max,&hd,hashmove);
        if (score!=UNKNOWN && hd>=depth) {
            if (min==max) return(min);
            if (min>=beta) return(min);
            if (max<=alfa) return(alfa);
            if (min>alfa) alfa=min;
        }
        if (score!=UNKNOWN && min==WIN) return(WIN);
        if (score!=UNKNOWN && max==LOSE) return(LOSE);
    }

    /* generate moves */
    nmoves=move_list(cdepth,color);
    if (nmoves==0) return(LOSE);

    /* check for beta cut from hash tables */
    if (nmoves==1) goto nosort;
    
    if (use_hash && depth>=200) {
        if (stopflag==true) return(alfa);
        for(nr=0; nr<nmoves; nr++) {
            do_move(movelist[cdepth][nr]);
            score=retreive_hash(color^1,&min,&max,&hd,dummymove);
            if (score!=UNKNOWN) if (hd>=(depth-100)) {
                    score=-max;
                    if (score>=beta) {
                        storemove(cdepth,movelist[cdepth][nr]);
                        undo_move(movelist[cdepth][nr]);
                        return(score);
                    }
                    if (score>alfa) alfa=score;
                }
            undo_move(movelist[cdepth][nr]);
        }
    }

    /* move ordering */
    if (hashmove[0]!=0) sort_viahash(cdepth,nmoves,hashmove,depth,color);
    else if (depth>=800) {
        do_presearch(cdepth,nmoves,color,depth);
    }
    else {
        if (kill_method==KILLER) findkiller(cdepth,nmoves);
        else if (kill_method==PROBKILL) {
            int lm,mnr;
            lm=move_nr(movelist[cdepth-1][current_move[cdepth-1]]);
            for(nr=0;nr<nmoves;nr++) {
                mnr=move_nr(movelist[cdepth][nr]);
                giterscore[nr]=2*history[cdepth][mnr][nmoves];
                giterscore[nr]+=countermove[cdepth&1][lm][mnr];
            }
            sort_moves(cdepth,nmoves,giterscore);
        }
        else if (kill_method==HISTORY) {
            for(nr=0;nr<nmoves;nr++) giterscore[nr]=history[cdepth]
                                                        [ move_nr(movelist[cdepth][nr]) ] [0];
            sort_moves(cdepth,nmoves,giterscore);
        }
    }

    if (depth>=500) goto nosort;
    /* tactical pattern sort */
    if (hashmove[0]==0 && depth>=200 && depth<=300) {
        char temp[MOVEL];
        int i;
        
        pat=npat_find(color,cdepth+1);
        if (pat==true) {
            for(i=0;i<nmoves;i++) if (movecmp(movelist[cdepth][i],movelist[cdepth+1][0])==0) {
                if (i!=0) {
                    movecopy(temp,movelist[cdepth][0]);
                    movecopy(movelist[cdepth][0],movelist[cdepth][i]);
                    movecopy(movelist[cdepth][i],temp);
                }
                break;
            }
            //display_board();
            //printf("\n");
        }        
    }
nosort:
    /* start normal alfa-beta search */
    for(nr=0;nr<nmoves;nr++) {
        newflags=flags;
        do_move(movelist[cdepth][nr]);
        if (cdepth<8) current_move[cdepth]=nr;
        nextdepth=depth-100;

        if (depth>100) {
            mateval=-material(color^1);
            if (mateval<(alfa-800)) if (quiet(color^1)==true && quiet(color)==true) {
                    nextdepth-=100;
                }
            if (mateval<(alfa-3400)) if (quiet(color^1)==true && quiet(color)==true) {
                    nextdepth-=100;
                }
        }


#ifdef notdef
        if (cdepth<8 && cdepth>=2 && nextdepth==depth-100) {
            /* extend if previous move was local */
            char *lastmove;
            lastmove=movelist[cdepth-2][current_move[cdepth-2]];
            if (movelist[cdepth][nr][1]==lastmove[lastmove[0]-1]) {
                nextdepth=depth;
            }
        }
#endif
        if (nextdepth<=0) { /* last move ? : check quiescence */
            q=quiet(color^1);
            /*if (eval_type==0 && q==true) {*/
                /*if (doSearchExtend(color)==true) {
                    if (cdepth>40) {display_board();
                        printf("cc1 %i\n",color);
                    }
                    q=false;
                    nextdepth=1;
                    dbfail++;
                }*/
            /*}          */
            if (q==false) {
                nextdepth+=99;
                while(nextdepth<0) nextdepth+=100;
            } 
            /*if (quiet(color)==false) {
                nextdepth+=99;
                while(nextdepth<0) nextdepth+=100;
            }*/
        }
        else if ((flags&EXTEND_TAKE)<=MAXEXTEND && nmoves<=2 && depth<=600) {
            nextdepth=depth;
            newflags++;
        }
        if (cdepth<4) {
            if (windows==true) {
                if (depth>500 && tneval>50000) {
                    if (cdepth==0) {
                        winprint("\n");
                        winprint("PROGRESS|%i|%i|%i|%llu|*\n",depth,nr+1,nmoves,tneval);
                    }
                }
            }
        }
        score=-alfabeta(-beta,-alfa,color ^1,cdepth+1,nextdepth,newflags,&oppex);
        
        //dprint("ab: %i %i %i %i\n",cdepth,nr,-beta,-alfa);
        //dprint("sc: %i %i %i\n",cdepth,nr,score);
        //if (eval_type==0 && score>alfa && score<betaOrig && nr>0) { /* research */
            /*if (cdepth==0) dprint("research: %i\n",score);*/
          //  score=-alfabeta(-betaOrig,-score,color ^1,cdepth+1,nextdepth,newflags,&oppex);
       //     dprint("sc2: %i\n",score);
        
        //}
        /*score=-alfabeta(-200000,200000,color ^1,cdepth+1,nextdepth,newflags,&oppex);*/
        /*if (cdepth==0) {
            print_move(movelist[cdepth][nr]);
            dprint("  %i\n",score);
        }*/
abdone:
        /* store score for each move (at root only) */
        if (cdepth==0) {
            movecopy(movescore[nr].move,movelist[cdepth][nr]);
            movescore[nr].value=score;
            
            /*printf("%i/%i\r  ",nr,nmoves); fflush(stdout);*/
        }
        if (oppex==EXACTDRAW || oppex==ATMOSTDRAW) atleastdraw=true;
        if (!(oppex==EXACTDRAW || oppex==ATLEASTDRAW)) if (score!=LOSE) atmostdraw=false;
        /*if (cdepth==0) printf("-->%i %i\n",atleastdraw,atmostdraw);*/
        /* beta cut */
        if (score>=beta) {
            storemove(cdepth,movelist[cdepth][nr]);
            goodmove(cdepth,movelist[cdepth][nr],nmoves);
            undo_move(movelist[cdepth][nr]);
            if (use_hash && depth>USEHASH) store_hash(color,depth,score,INF,movelist[cdepth][nr]);
            if (atleastdraw==true || score==WIN) *exact=ATLEASTDRAW;
            else *exact=NOTEXACT;
            if (nr==nmoves-1) {
                if (atleastdraw==true && atmostdraw==true) *exact=EXACTDRAW;
                else if (atleastdraw==true) *exact=ATLEASTDRAW;
                else if (atmostdraw==true) *exact=ATMOSTDRAW;
                else *exact=NOTEXACT;
                /*if (*exact==EXACTDRAW) {printf("%i.",pieces[white|man]+pieces[white|crown]+pieces[black|man]+pieces[black|crown]); if (pieces[white|man]+pieces[white|crown]+pieces[black|man]+pieces[black|crown]>=8) {printf("\n%i\n",color);display_board();}}*/
            }
            return(score);
        } else badmove(cdepth,movelist[cdepth][nr],nmoves);
        undo_move(movelist[cdepth][nr]);
        if (score>alfa) {
            alfa=score;
            best=nr;
            storemove(cdepth,movelist[cdepth][nr]);
        }
    }
    if (best!=-1) {
        goodmove2(cdepth,movelist[cdepth][best],nmoves);
    }
    if (use_hash && depth>USEHASH && alfa>alfa0) store_hash(color,depth,alfa,alfa,movelist[cdepth][best]);
    if (atleastdraw==true && atmostdraw==true) *exact=EXACTDRAW;
    else if (atleastdraw==true) *exact=ATLEASTDRAW;
    else if (atmostdraw==true) *exact=ATMOSTDRAW;
    else *exact=NOTEXACT;
    /*if (*exact==EXACTDRAW) {printf("%i.",pieces[white|man]+pieces[white|crown]+pieces[black|man]+pieces[black|crown]);if (pieces[white|man]+pieces[white|crown]+pieces[black|man]+pieces[black|crown]>=8) {printf("\n%i\n",color);display_board();}}*/
    /*if (*exact==EXACTDRAW) {display_board();printf("\n");}*/
    return(alfa);
}


#ifdef notdef
        int z,i,ok;

        if (pieces[white|man]>=6 && eval_type==0) {
            pat_try++;
            //printf("hello1\n");

            pat=tpat_reconize(color);/*printf("hello2\n");*/

            if (pat!=-1) {
                pat_found++; 
                if (cdepth==0) {
                    //display_board();
                    //printf("%i\n",tpat[pat].nmoves);
                }
                
                for(z=0;z<tpat[pat].nmoves;z++) {/*printf("hello3\n");*/
                    ok=false;
                    nmoves=move_list(cdepth+z,(color+z)%2);
                    if (z%2==1) if (nmoves!=1) goto patch;
                    if (color==white) {
                        for(i=0;i<nmoves;i++) if (movecmp(movelist[cdepth+z][i],tpat[pat].movelist[z])==0) {
                                do_move(movelist[cdepth+z][i]);
                                moveselect[cdepth+z]=i;
                                ok=true;
                                break;
                            }
                    }
                    else {
                        for(i=0;i<nmoves;i++) if (reverse_movecmp(movelist[cdepth+z][i],tpat[pat].movelist[z])==0) {
                                do_move(movelist[cdepth+z][i]);
                                moveselect[cdepth+z]=i;

                                ok=true;
                                break;
                            }
                    }
patch:
                    if (ok==false) {
                        tpat[pat].use_fail++;
                        /*printf("impossible to do moves\n");*/
                        for(i=z-1;i>=0;i--) undo_move(movelist[cdepth+i][moveselect[cdepth+i]]);
                        return(evalboard(color,alfa,beta,&precise));
                    }
                } /* all moves done now eval */
                deval[cdepth+z]++;
                min=evalboard((color+z)%2,-INF,INF);

                if ((color+z)%2!=color) min=-min;
                for(i=z-1;i>=0;i--) {
                    undo_move(movelist[cdepth+i][moveselect[cdepth+i]]);
                }
                deval[cdepth]++;
                score=evalboard(color,alfa,beta,&precise);
                /*printf("pat:%i %i\n",score,min);*/
                if (min>score+500) {
                /*display_board();
                dprint("%i\n",color);
                print_move(tpat[pat].movelist[0]);
                save_board(color,"bla.dcp");*/
                /*stop=0;
                dscanf("%s",&stop);
                if (stop==1) exit(1);*/

                    tpat[pat].use_succes++;
                    pat_succes++;
                }
                return(min>score?min:score);
            }
        }
    #endif
















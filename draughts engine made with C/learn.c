/*
 * Copyright 1996, 2003 by Michel D. Grimminck
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

#include <time.h>
#include <stdio.h>
#include "functions.h"
#include "var.h"

#define maxmoves 180  /* maximal number of moves */

int randomgame(int games,  /* number of games to play */
               int depth1, /* player 1 search depth */
               int eval1,  /* player 1 evaluation type */
               int depth2, /* player 2 search depth */
               int eval2,  /* player 2 evaluation type */
               int learn)  /* use games to learn */
{
    double sigma=0;  /* 1-sigma error in score */
    int g,r,i,color=white,n,movenr=0;
    int score,currentscore,exact;
    char local[52];
    int test=white;
    int win=0,lose=0,draw=0;
    int gamelength=0,depth;
    INT64 totEval[2];
    FILE *corr;
    int t1,t2,t3,t4;
    int stop;
    int totPat[2];
    float totTime[2]={0.0F, 0.0F};
    BTYPE tmpBoard[93];
    int highestDrawScore=2000;
    int highestScore=0;
    int n1;
    int rmove;
    char comment[MAXCOMMENT];
    float t;
    float at;
    
    totEval[0]=0LL;
    totEval[1]=0LL;
    totPat[0]=0;
    totPat[1]=0;
    
    timeControlMoves=100;
    timeForFirstControl=depth1;
    timeControlMoves2=100;
    timeForSecondControl=depth1;
    time_reserve=0;
    operator_time=0;
    
    corr=fopen("corr","a");
    g=0; /* the number of accepted games played so far */
    while (g<games) {
        init_board();
        color=white;
        for(i=0;i<10;i++) {
            n=move_list(0,color);
            rmove=rand()%n;
            do_move(movelist[0][rmove]);
            xstore_history(movelist[0][rmove],"random move");
            winShowHistory();
            color^=1;
        }
        init_stats();
        init_hash();
        
        currentscore=alfabeta(-INF,INF,color,0,500,0,&exact);
        if (currentscore>500 || currentscore<-500) continue;
        highestScore=0;   
        for (movenr=10;movenr<maxmoves;movenr++) {
            if (games==1) display_board();
            score=0;
            n=move_list(0,color);
            /*display_board();*/
            if (n==1) {
                do_move(movelist[0][0]);
                xstore_history(movelist[0][0],"forced move");
                winShowHistory();

                if (games==1) {
                    print_move(movelist[0][0]);
                    printf("\n");
                }
            }
            else if (n==0) break;
            else if (n!=10000) {
                /*if ((pieces[white|man]+pieces[black|man]+pieces[white|crown]+pieces[black|crown])==6) {
                    init_stats();
                    display_board();
                    do_pn_search(color,2000,WINTHEO,2);
                }*/
                /*init_stats();
                init_hash();
                */
                if (color==test) {
                    depth=depth1;
                    eval_type=eval1;
                }
                else {
                    depth=depth2;
                    eval_type=eval2;
                }
                if (pieces[white|man]+pieces[black|man]+pieces[white|crown]+pieces[black|crown]>12) {
                    depth=400;
                }
                
                if (theoretic(color)==DRAW) {score=0; break;}
                /*t=clock();
                neval=0;
                pat_succes=0;
                currentscore=alfabeta(-INF,INF,color,0,depth-200,0,&exact);
                score=alfabeta(-INF,INF,color,0,depth,0,&exact);
                totEval[test^color]+=neval;
                totPat[test^color]+=pat_succes;
                if (score>highestScore) {
                    highestScore=score;
                    copy_board(tmpBoard,board);
                }*/
                at=alloc_time(game_color);
                //score=play(color,at,100*MAXPLY,-1);
                //display_board();
                //printf("cc %i\n",color);
                allowTwoPlyIncrements=false;
                score=play(color,100,depth,-1);
                    
                totEval[test^color]+=neval;
                totPat[test^color]+=pat_succes;

                t=(clock()-t)/CLOCKS_PER_SEC; /* time to move */
                printf("%i: ",eval_type);
                printf("time1: %.1f time2:%.1f at:%.2f dp:%i %i:   %.3f  ",timeUsed[0],timeUsed[1],at,lastSearchDepth/100,color,score/1000.0F); print_pv();
                
                /*if (quiet(color) && (score<(currentscore-800) || score>(currentscore+800))) {
                    display_board();
                    dprint("score at %i ply: %.3f\n",(depth-200)/100,currentscore/1000.0F);
                    dprint("score at %i ply: %.3f\n",(depth)/100,score/1000.0F);
                    print_pv();
                    
                    dscanf("%i",&stop);
                }
                */
                if (quiet(color)==true && color==white) {
                    int p;
                    fprintf(corr,"%i %i ",score,currentscore);

                    fprintf(corr,"\n");
                }
                if (score<-9700 || score>9700) break;
                /*do_move(PV[0][0]);*/
                sprintf(comment,"[%%egt 0:0:%.1f][%%eval %.3f]",t,score/1000.0F);
                /*xstore_history(PV[0][0],comment);
                winShowHistory();*/
                t1=pieces[2];
                t2=pieces[3];
                t3=pieces[4];
                t4=pieces[5];
                set_pieces();
                if (t1!=pieces[2] || t2!=pieces[3] || t3!=pieces[4] || t4!=pieces[5]) {
                    display_board();
                    printf(".. %i %i %i %i\n",t1,t2,t3,t4);
                    printf(".. %i %i %i %i\n",pieces[2],pieces[3],pieces[4],pieces[5]);
                    exit(1);
                }

            if (theoretic(color)==DRAW) {score=0; break;}
            }
            color^=1;
        }
        if ((score<-9500 || score>9500) && movenr>14) {
            /* score for white */
            if (color==black) score=-score; 
            if (score>0) sprintf(pdn_info.result,"1-0");
            if (score<0) sprintf(pdn_info.result,"0-1");
            if (test==white && score>0)  win++;
            if (test==white && score<0)  lose++;
            if (test==black && score>0)  lose++;
            if (test==black && score<0)  win++;
            if (theoretic(color)==DRAW) { draw++; sprintf(pdn_info.result,"1/2-1/2");}
        
            printf("game:%i color:%i score:%.3f\n",g,color,score/1000.0F);
            test^=1; g++;
            gamelength+=movenr;
        } 
        else {
            draw++;
            sprintf(pdn_info.result,"1/2-1/2");
            /*if ((score>-500 && score<500) && highestScore>highestDrawScore) {
                display_board();
    
                highestDrawScore=highestScore;
                copy_board(board,tmpBoard);
                printf("Highest score: %i\n",highestScore);
                display_board();
                dscanf("%i",&stop);
            }*/
        }
    display_board();
    if (depth>=600) {
        
        if (test==white) {
            sprintf(pdn_info.whitepl,"Dragon draughts %s, depth=%i, evaltype=%i",VERSION,depth1/100,eval1);
            sprintf(pdn_info.blackpl,"Dragon draughts %s, depth=%i, evaltype=%i",VERSION,depth2/100,eval2);
        } else
        {
            sprintf(pdn_info.blackpl,"Dragon draughts %s, depth=%i, evaltype=%i",VERSION,depth1/100,eval1);
            sprintf(pdn_info.whitepl,"Dragon draughts %s, depth=%i, evaltype=%i",VERSION,depth2/100,eval2);
        }
        write_pdn("autoplay.pdn");
    }
    totTime[test^1]+=timeUsed[0];
    totTime[test]+=timeUsed[1];

    n1=win+draw+lose;
    sigma=sqrt( ((double) (4*win+draw)/n1 -(double) (2*win+draw)*(2*win+draw)/(n1*n1))/n1);
    printf("%iv%i  win:%i  lose:%i  draw:%i score:%.3f (+/- %.3f) t1:%.1f t2:%.1f eval:%llu v %llu pat %i/%i\n",eval1,eval2,win,lose,draw,(float)(2*win+draw)/(win+draw+lose),sigma,totTime[0],totTime[1],totEval[0],totEval[1],totPat[0],totPat[1]);
    
    }
    eval_type=NORMAL;
    fclose(corr);
    return(0);
}

int predict_move(int color, int level,char *move)
{
    int score,nmoves,exact;

    nmoves=move_list(0,color);
    if (nmoves==0) {printf("no moves\n"); return(false);}
    if (nmoves==1) return(true);
    init_stats();
    init_hash();
    set_eval();
    score=alfabeta(-INF,INF,color,0,level-400,0,&exact);
    score=alfabeta(-INF,INF,color,0,level-200,0,&exact);
    score=alfabeta(-INF,INF,color,0,level,0,&exact);
    if (movecmp(PV[0][0],move)==0) return(true);
    return(false);
}

void best_fit(void)
{
    int i,bestscore=-100000,best,score,j;
    char local[50];

    for(i=0;i<50;i++) local[i]=board[map[i]];

    for(i=0;i<ref_nr;i++) {
        score=0;
        for(j=0;j<50;j++) if (local[j]!=ref_board[i][j]) score--;
    if (score>bestscore) {bestscore=score; best=i;}
    }
    printf("best:%i  score:%i  move:",best,bestscore);
    print_move(ref_move[best]); printf("\n");
    for(j=0;j<50;j++) board[map[j]]=ref_board[best][j];
    display_board();
}

int read_comment(FILE *in,char *comment)
{
    int i,bracket;
    char u;

    do {
        u=fgetc(in);
    } while(u<=32);
    if (u!='{') {
        ungetc(u,in);
        return(0);
    }
    i=0;
    bracket=1;
    do {
        u=fgetc(in);
        if (u=='{') bracket++;
        if (u=='}') bracket--;
        if (bracket==0) break;
        if (i<128) comment[i++]=u;
    } while(true);
    comment[i]=0;
    return(i);
}

int check_database(char *file,int min,int max)
{
    FILE *in;
    char field[2048];
    int c,i,n,col,correct=0,try=0,exact;
    char move[32],comment[MAXCOMMENT];
    int total,count=0,games=0,playmove;
    float q=0;
    int result; //1=white wins, 0=draw, -1=black wins
    in=my_fopen(file,"r");
    if (in==NULL) {printf("error opening database\n"); return(0);}

    do {
        result=0;
        playmove=0;
        col=2;
        /* read leader */
        if (feof(in)) break;
        do {
            n=fgetc(in);
            if (n<0) goto endread;
            if (n=='[') {
                ungetc(n,in);
                fgets(field,2048,in);
                printf("%s\n",field);
                if (strncmp(field,"[Result \"1-0\"]",14)==0) result=1;
                if (strncmp(field,"[Result \"1/2-1/2\"]",18)==0) result=0;
                if (strncmp(field,"[Result \"0-1\"]",14)==0) result=-1;
                //printf("%s",field);
            }
        } while (n!='1');
        ungetc(n,in);
        init_board();
        init_stats();

        do {
            c=read_comment(in,comment);
            /*if (c!=0) printf("comment:'%s'\n",comment);*/
            n=fscanf(in,"%s",field);
            if (strcmp(field,"1-0")==0 || strcmp(field,"0-1")==0 || strcmp(field,"1/2-1/2")==0 || strcmp(field,"*")==0 ) {
                if (parameters[0]==-5) {
                    display_board();
                    printf("tomove:%i %s\n",col,field);
                }
                if (parameters[0]==-6) {
                    int score1,score2,score3,score4,score5,score6;
                    if (col==2) col=white;
                    display_board();
                    init_hash(); init_stats();
                    set_eval();
                    score1=alfabeta(-INF,INF,col,0,0,0,&exact);
                    score2=alfabeta(-INF,INF,col,0,200,0,&exact);
                    score3=alfabeta(-INF,INF,col,0,400,0,&exact);
                    score4=alfabeta(-INF,INF,col,0,800,0,&exact);
                    score5=alfabeta(-INF,INF,col,0,1000,0,&exact);
                    score6=alfabeta(-INF,INF,col,0,1200,0,&exact);
                    if (col==black) {
                        score1=-score1;
                        score2=-score2;
                        score3=-score3;
                        score4=-score4;
                        score5=-score5;
                        score6=-score6;
                    }
                    printf("tomove:%i result:%s score:%i %i %i %i %i %i\n",col,field,score1,score2,score3,score4,score5,score6);
                }
                break;
            }
            if (col!=2) {
                c=strlen(field);
                if (field[c-1]=='-' || field[c-1]=='x') {
                    n=fscanf(in,"%s",&field[c]);
                }

                n=text_to_move(field,col,move);
                if (n==false) {
                    printf("errornous move:'%s'\n",field);
                    return(-1);
                }

                total=pieces[white|man]+pieces[white|crown]+
                      pieces[black|man]+pieces[black|crown];
                if (total>=min && total<=max) q-=perc;
                if (total>=min && total<=max && q<=0) {
                    count++;q+=1.0F;
                    if (parameters[0]>0) {
                        try++;
                    if (try%25==0) {printf(".");fflush(stdout);}
                        if (predict_move(col,parameters[0],move)==true) correct++;
                    }
                    if (parameters[0]==-2) {
                        for(i=0;i<50;i++) ref_board[count][i]=board[map[i]];
                        movecopy(ref_move[count],move);
                    }
                    if (parameters[0]==-3 && playmove<30) {
                        int res;
                    
                        res=result;
                        if (col==black) res=-result;
                        add_book_entry(col,res,0,true);
                    }
                    if (parameters[0]==-4) store_history(move,0,0);
                    if (parameters[0]==-7 && quiet(col)==true && pieces[white|man]>2 && pieces[white|crown]==0 && pieces[black|man]>2 && pieces[black|crown]==0) {
                        BTYPE temp[93];
                        int nr1,nr2,nmoves1,nmoves2;
                        nmoves1=move_list(MAXPLY-2,col);
                        for(nr1=0;nr1<nmoves1;nr1++) {
                            do_move(movelist[MAXPLY-2][nr1]);
                            nmoves2=move_list(MAXPLY-1,col^1);
                            for(nr2=0;nr2<nmoves2;nr2++) {
                                do_move(movelist[MAXPLY-1][nr2]);
                                copy_board(temp,board);
                                plearn(col,800);
                                copy_board(board,temp);
                                undo_move(movelist[MAXPLY-1][nr2]);
                            }
                            undo_move(movelist[MAXPLY-2][nr1]);
                        }
                    }
                    if (parameters[0]==-1) {display_board();print_move(move); printf("\n");}

                    playmove++;
                }
                do_move(move);
            }
            col=(col+1)%3;
        } while (n>0);
        if (parameters[0]==-1) printf("\n");
        games++;
    } while(!feof(in));
endread:
    fclose(in);
    /*if (parameters[0]>0) {
        printf("\ncorrect predictions:%i out %i\n",correct,try);
        }*/
    if (parameters[0]==0) printf("total count in range:%i\n, %i games",count,games);
    ref_nr=count;
    if (parameters[0]==-3) book_info();
    if (parameters[0]==-4) return(count);
    return(correct);
}

void readTestPositions()
{
    int i;
    char buffer[1024];
    int e[20];
    int e10,e16;
    int de[20];
    int k;
    int max=8;
    float tstart;
    int exact,col;
    int cntErr[20];
    FILE *out;
    double diff=0.0;
    int n;
    out=fopen("result.txt","w");
    if (out==NULL) {
        return;
    }
    for (k=0;k<10;k++) cntErr[k]=0;
    
    tstart=clock();
    n=50;
    for (i=0;i<n;i++) {
        sprintf(buffer,"testl/%i.dcp",i+4200);
        load_board(buffer);
        
        {
            init_hash(); init_stats();
            set_eval();
            col=white;
            printf("%i\n",i);
            for (k=0;k<=max;k++) {
                e[k]=alfabeta(-INF,INF,col,0,100*k,0,&exact);
                //printf("%i  %i\n",e[k]);
            }
            fprintf(out,"%i %i %i %i %i %i %i %i %i\n",i,e[0],e[1],e[2],e[3],e[4],e[5],e[6],e[8]);
            for (k=0;k<=max-2;k++) {
                de[k]=e[k]-e[max];
                if (de[k]<0) de[k]=-de[k];
                
                if (e[max]-e[k]<-500 || e[max]-e[k]>500) {
                    if (k==0) {
                        display_board();
                        print_pv();
                        printf("%i %i %i %i %i %i %i %i %i\n",i,e[0],e[1],e[2],e[3],e[4],e[5],e[6],e[8]);
                        plearn(white,500);
                    }
                  cntErr[k]+=1;
    
                }
            }
            diff+=(e[max]-e[0])*(e[max]-e[0]);
        }
    }
    fclose(out);
    printf("av: %lf\n",sqrt(diff/n));
    for (k=0;k<=max-2;k++) {
        printf("err %i=%i\n",k,cntErr[k]);
    }
    printf("total time: %f\n",(clock()-tstart)/CLOCKS_PER_SEC);
}
